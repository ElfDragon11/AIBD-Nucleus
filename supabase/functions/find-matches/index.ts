import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { embedText, cosineSimilarity, parseVector } from '../_shared/embeddings.ts'
import { edgeErrorObj, edgeLog, edgeWarn, previewText } from '../_shared/edge_logger.ts'
import {
  coerceLeadType,
  opportunityPassesHardFilter,
  personPassesHardFilter,
} from '../_shared/matching_rules.ts'
import {
  scoreOpportunity,
  scorePerson,
  type OpportunityRow,
  type PersonRow,
} from '../_shared/match_scoring.ts'
import { callOpenAiJson } from '../_shared/llm.ts'
import { buildFindMatchesMessages } from '../_shared/prompts.ts'
import { findMatchesLlmSchema } from '../_shared/schemas.ts'
import { introEmailDraftWithLlmFallback } from '../_shared/generate_pair_intro_llm.ts'
import type { PairIntroLead } from '../_shared/pair_intro_email.ts'
import { createServiceClient, fetchLeadVerified } from '../_shared/supabase_admin.ts'

const FN = 'find-matches'

type PersonDb = PersonRow & {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  title: string | null
  organization: string | null
  embedding: string | null
}

type OpportunityDb = OpportunityRow & {
  id: string
  name: string
  embedding: string | null
  contact_email: string | null
}

type Unified = {
  kind: 'person' | 'opportunity'
  id: string
  overall: number
  breakdown: Record<string, number>
  title: string
  summary: string
  person: PersonDb | null
  opportunity: OpportunityDb | null
}

function buildLeadBlob(lead: {
  raw_intent: string | null
  ai_summary: string | null
  primary_type: string | null
}, fields: { field_key: string; field_value: unknown }[]): string {
  const lines: string[] = []
  if (lead.raw_intent) lines.push(`Intent: ${lead.raw_intent}`)
  if (lead.ai_summary) lines.push(`Summary: ${lead.ai_summary}`)
  if (lead.primary_type) lines.push(`Primary type: ${lead.primary_type}`)
  for (const f of fields) {
    try {
      lines.push(`${f.field_key}: ${JSON.stringify(f.field_value)}`)
    } catch {
      lines.push(`${f.field_key}: (unserializable)`)
    }
  }
  return lines.join('\n').slice(0, 12000)
}

function templateExplain(kind: 'person' | 'opportunity', title: string): {
  why: string
  step: string
  gap: string
  conf: 'High' | 'Medium-high' | 'Medium' | 'Exploratory'
} {
  if (kind === 'person') {
    return {
      why: `${title} aligns directionally with what you described; we picked them for relevant experience in this ecosystem.`,
      step: `Request a short intro call through Nucleus with a three-bullet agenda (context, constraint, ask).`,
      gap: `Fit is directional — calibrate expectations on capacity and availability in the first conversation.`,
      conf: 'Medium',
    }
  }
  return {
    why: `This opportunity matches the bottleneck you surfaced; it is a structured path to make progress without committing prematurely.`,
    step: `Reply with one paragraph on your timing and what proof you can share next.`,
    gap: `Details may shift seasonally; confirm the host organization is still actively placing participants.`,
    conf: 'Medium',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as {
      lead_id?: string
      public_session_id?: string
      limit?: number
    }
    const leadId = body.lead_id?.trim()
    const sessionId = body.public_session_id?.trim()
    const limit = Math.max(2, Math.min(body.limit ?? 4, 4))

    if (!leadId || !sessionId) {
      return jsonResponse(
        { error: 'lead_id and public_session_id are required' },
        400,
      )
    }

    const supabase = createServiceClient()
    const lead = await fetchLeadVerified(supabase, leadId, sessionId)
    if (!lead) {
      return jsonResponse({ error: 'Lead not found or session invalid' }, 403)
    }

    const { data: fieldRows, error: fieldErr } = await supabase
      .from('lead_profile_fields')
      .select('field_key, field_value')
      .eq('lead_id', leadId)
    if (fieldErr) throw fieldErr

    const leadType = coerceLeadType(lead.primary_type)
    const blob = buildLeadBlob(lead, fieldRows ?? [])
    const searchBlob = blob.slice(0, 2000)

    edgeLog(FN, 'start', {
      lead_id: leadId,
      lead_type: leadType,
      blob_preview: previewText(blob),
    })

    const { error: delErr } = await supabase
      .from('match_records')
      .delete()
      .eq('lead_id', leadId)
      .eq('status', 'generated')
    if (delErr) throw delErr

    const { data: peopleRaw, error: peErr } = await supabase
      .from('people')
      .select(
        'id, person_types, sectors, skills, availability, stage_preferences, engagement_preferences, bio, embedding_text, embedding, first_name, last_name, email, title, organization',
      )
      .eq('status', 'active')
    if (peErr) throw peErr

    const { data: oppsRaw, error: opErr } = await supabase
      .from('opportunities')
      .select(
        'id, type, sector, stage, need_types, description, embedding_text, embedding, name, contact_email',
      )
      .eq('status', 'active')
    if (opErr) throw opErr

    const peopleAll = (peopleRaw ?? []) as PersonDb[]
    const oppsAll = (oppsRaw ?? []) as OpportunityDb[]

    const hasInventoryVectors =
      peopleAll.some((p) => p.embedding != null) ||
      oppsAll.some((o) => o.embedding != null)

    const embQ = await embedText(blob)
    const queryVec = embQ.ok ? embQ.vector : null
    if (!embQ.ok) {
      edgeWarn(FN, 'query_embed_failed', { reason: embQ.error })
    }

    const { data: kwP, error: kwPErr } = await supabase.rpc(
      'keyword_search_people',
      { p_query: searchBlob, p_limit: 60 },
    )
    if (kwPErr) edgeWarn(FN, 'keyword_people_rpc', { err: kwPErr.message })
    const { data: kwO, error: kwOErr } = await supabase.rpc(
      'keyword_search_opportunities',
      { p_query: searchBlob, p_limit: 60 },
    )
    if (kwOErr) edgeWarn(FN, 'keyword_opps_rpc', { err: kwOErr.message })

    const kwPeople = new Map<string, number>()
    for (const r of kwP ?? []) {
      if (r && typeof r.id === 'string' && typeof r.kw_rank === 'number') {
        kwPeople.set(r.id, r.kw_rank)
      }
    }
    const kwOpps = new Map<string, number>()
    for (const r of kwO ?? []) {
      if (r && typeof r.id === 'string' && typeof r.kw_rank === 'number') {
        kwOpps.set(r.id, r.kw_rank)
      }
    }

    let peopleFiltered = peopleAll.filter((p) =>
      personPassesHardFilter(leadType, p.person_types)
    )
    if (peopleFiltered.length === 0) peopleFiltered = peopleAll

    let oppsFiltered = oppsAll.filter((o) =>
      opportunityPassesHardFilter(leadType, o.type)
    )
    if (oppsFiltered.length === 0) oppsFiltered = oppsAll

    const signals = { leadType, blob: blob.toLowerCase() }

    const unified: Unified[] = []

    for (const p of peopleFiltered) {
      const emb = parseVector(p.embedding)
      let sim = 0
      if (queryVec && emb) {
        sim = cosineSimilarity(queryVec, emb)
        const kw = kwPeople.get(p.id) ?? 0
        if (kw > 0) sim = 0.78 * sim + 0.22 * Math.min(1, kw * 6)
      } else {
        const kw = kwPeople.get(p.id) ?? 0
        sim = Math.min(1, kw * 8)
        if (sim === 0 && hasInventoryVectors === false) sim = 0.25
      }

      const sc = scorePerson(signals, p, sim)
      const title =
        [p.first_name, p.last_name].filter(Boolean).join(' ') ||
        p.title ||
        p.organization ||
        'Community member'
      const summary = p.bio ?? p.embedding_text ?? ''
      unified.push({
        kind: 'person',
        id: p.id,
        overall: sc.overall,
        breakdown: sc.breakdown,
        title,
        summary,
        person: p,
        opportunity: null,
      })
    }

    for (const o of oppsFiltered) {
      const emb = parseVector(o.embedding)
      let sim = 0
      if (queryVec && emb) {
        sim = cosineSimilarity(queryVec, emb)
        const kw = kwOpps.get(o.id) ?? 0
        if (kw > 0) sim = 0.78 * sim + 0.22 * Math.min(1, kw * 6)
      } else {
        const kw = kwOpps.get(o.id) ?? 0
        sim = Math.min(1, kw * 8)
        if (sim === 0 && hasInventoryVectors === false) sim = 0.25
      }

      const sc = scoreOpportunity(signals, o, sim)
      unified.push({
        kind: 'opportunity',
        id: o.id,
        overall: sc.overall,
        breakdown: sc.breakdown,
        title: o.name,
        summary: o.description ?? o.embedding_text ?? '',
        person: null,
        opportunity: o,
      })
    }

    unified.sort((a, b) => b.overall - a.overall)
    const topPool = unified.slice(0, 20)

    if (topPool.length === 0) {
      edgeWarn(FN, 'empty_pool', { lead_id: leadId })
      return jsonResponse({ matches: [], message: 'No candidates available' })
    }

    const lm = await callOpenAiJson<Record<string, unknown>>(
      buildFindMatchesMessages({
        leadSummary: blob.slice(0, 3500),
        leadType: leadType,
        candidates: topPool.map((c) => ({
          kind: c.kind,
          id: c.id,
          title: c.title,
          summary: c.summary,
          structured_score: c.overall,
        })),
      }),
    )

    const poolByKey = new Map<string, Unified>()
    for (const c of topPool) {
      poolByKey.set(`${c.kind}:${c.id}`, c)
    }

    let chosen: {
      kind: 'person' | 'opportunity'
      id: string
      why_this_fits: string
      best_next_step: string
      potential_gap: string | null
      confidence_label: string
      overall: number
      breakdown: Record<string, number>
    }[] = []

    if (lm.ok) {
      const parsed = findMatchesLlmSchema.safeParse(lm.data)
      if (parsed.success) {
        for (const row of parsed.data.final_matches) {
          const pk = `${row.kind}:${row.id}`
          const base = poolByKey.get(pk)
          if (!base) {
            edgeWarn(FN, 'llm_unknown_id', { id: pk })
            continue
          }
          chosen.push({
            kind: row.kind,
            id: row.id,
            why_this_fits: row.why_this_fits,
            best_next_step: row.best_next_step,
            potential_gap: row.potential_gap ?? null,
            confidence_label: row.confidence_label,
            overall: base.overall,
            breakdown: base.breakdown,
          })
        }
      } else {
        edgeWarn(FN, 'llm_schema_mismatch', {})
      }
    } else {
      edgeWarn(FN, 'llm_failed', { reason: lm.error })
    }

    if (chosen.length > 0 && chosen.length < 2 && topPool.length >= 2) {
      const existing = new Set(chosen.map((c) => `${c.kind}:${c.id}`))
      for (const u of topPool) {
        if (chosen.length >= 2) break
        const k = `${u.kind}:${u.id}`
        if (existing.has(k)) continue
        const t = templateExplain(u.kind, u.title)
        chosen.push({
          kind: u.kind,
          id: u.id,
          why_this_fits: t.why,
          best_next_step: t.step,
          potential_gap: t.gap,
          confidence_label: t.conf,
          overall: u.overall,
          breakdown: u.breakdown,
        })
        existing.add(k)
      }
    }

    if (chosen.length === 0) {
      const count =
        topPool.length >= 2
          ? Math.max(2, Math.min(limit, topPool.length))
          : Math.min(limit, topPool.length)
      chosen = topPool.slice(0, count).map((c) => {
        const t = templateExplain(c.kind, c.title)
        return {
          kind: c.kind,
          id: c.id,
          why_this_fits: t.why,
          best_next_step: t.step,
          potential_gap: t.gap,
          confidence_label: t.conf,
          overall: c.overall,
          breakdown: c.breakdown,
        }
      })
    } else if (chosen.length > limit) {
      chosen = chosen.slice(0, limit)
    }

    const records = []
    for (const c of chosen) {
      const base = poolByKey.get(`${c.kind}:${c.id}`)!
      const { text: intro } = await introEmailDraftWithLlmFallback(lead as PairIntroLead, {
        kind: c.kind,
        displayTitle: base.title,
        person: base.person,
        opportunity: base.opportunity,
        why_this_fits: c.why_this_fits,
        best_next_step: c.best_next_step,
      })
      records.push({
        lead_id: leadId,
        person_id: c.kind === 'person' ? c.id : null,
        opportunity_id: c.kind === 'opportunity' ? c.id : null,
        matched_record_type: c.kind,
        matched_record_id: c.id,
        overall_score: c.overall,
        confidence_label: c.confidence_label,
        why_this_fits: c.why_this_fits,
        best_next_step: c.best_next_step,
        potential_gap: c.potential_gap,
        score_breakdown: c.breakdown as Record<string, unknown>,
        status: 'generated' as const,
        intro_email_draft: intro,
      })
    }

    const { error: insErr } = await supabase.from('match_records').insert(records)
    if (insErr) throw insErr

    const outMatches = chosen.map((c) => {
      const base = poolByKey.get(`${c.kind}:${c.id}`)!
      return {
        matched_record_type: c.kind,
        matched_record_id: c.id,
        card_title: base.title,
        match_kind_label:
          c.kind === 'person'
            ? `Person · ${(base.person?.person_types ?? []).join(', ') || 'intro'}`
            : `Opportunity · ${base.opportunity?.type ?? 'match'}`,
        overall_score: c.overall,
        confidence_label: c.confidence_label,
        why_this_fits: c.why_this_fits,
        best_next_step: c.best_next_step,
        potential_gap: c.potential_gap,
      }
    })

    edgeLog(FN, 'ok', { lead_id: leadId, saved: records.length })

    return jsonResponse({ matches: outMatches })
  } catch (e) {
    edgeErrorObj(FN, 'unhandled_exception', e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
