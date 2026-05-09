import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { edgeErrorObj, edgeLog, edgeWarn } from '../_shared/edge_logger.ts'
import { introEmailDraftWithLlmFallback } from '../_shared/generate_pair_intro_llm.ts'
import type { PairIntroLead } from '../_shared/pair_intro_email.ts'
import { createServiceClient, getAdminUserFromRequest } from '../_shared/supabase_admin.ts'

const FN = 'generate-match-intro'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabase = createServiceClient()
    const admin = await getAdminUserFromRequest(supabase, req)
    if (!admin) {
      return jsonResponse({ error: 'Admin access required' }, 403)
    }

    const body = (await req.json()) as { match_id?: string }
    const matchId = body.match_id?.trim()
    if (!matchId) {
      return jsonResponse({ error: 'match_id is required' }, 400)
    }

    const { data: m, error: mErr } = await supabase
      .from('match_records')
      .select(
        'id, lead_id, person_id, opportunity_id, matched_record_type, why_this_fits, best_next_step',
      )
      .eq('id', matchId)
      .maybeSingle()
    if (mErr) throw mErr
    if (!m) return jsonResponse({ error: 'Match not found' }, 404)

    const { data: lead, error: lErr } = await supabase
      .from('leads')
      .select('first_name, last_name, email, ai_summary, raw_intent, primary_type')
      .eq('id', m.lead_id)
      .maybeSingle()
    if (lErr) throw lErr
    if (!lead) return jsonResponse({ error: 'Lead not found for match' }, 404)

    let person: {
      title: string | null
      organization: string | null
      bio: string | null
      email: string | null
    } | null = null

    let opportunity: {
      description: string | null
      stage: string | null
      type: string
      name: string
      contact_email: string | null
    } | null = null

    let displayTitle = ''

    if (m.person_id && m.matched_record_type === 'person') {
      const { data: p, error: pErr } = await supabase
        .from('people')
        .select('first_name, last_name, email, title, organization, bio')
        .eq('id', m.person_id)
        .maybeSingle()
      if (pErr) throw pErr
      if (p) {
        person = {
          title: p.title,
          organization: p.organization,
          bio: p.bio,
          email: p.email,
        }
        displayTitle =
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          p.email ||
          'Community member'
      }
    } else if (m.opportunity_id && m.matched_record_type === 'opportunity') {
      const { data: o, error: oErr } = await supabase
        .from('opportunities')
        .select('name, type, stage, description, contact_email')
        .eq('id', m.opportunity_id)
        .maybeSingle()
      if (oErr) throw oErr
      if (o) {
        opportunity = {
          description: o.description,
          stage: o.stage,
          type: o.type,
          name: o.name,
          contact_email: o.contact_email,
        }
        displayTitle = o.name
      }
    }

    if (!displayTitle || (!person && !opportunity)) {
      return jsonResponse(
        { error: 'Could not load counterparty for this match record' },
        400,
      )
    }

    const kind = m.matched_record_type as 'person' | 'opportunity'
    const leadForIntro: PairIntroLead = {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      ai_summary: lead.ai_summary,
      raw_intent: lead.raw_intent,
      primary_type: lead.primary_type,
    }

    const { text: intro, source } = await introEmailDraftWithLlmFallback(leadForIntro, {
      kind,
      displayTitle,
      person,
      opportunity,
      why_this_fits: m.why_this_fits ?? '',
      best_next_step: m.best_next_step ?? '',
    })

    if (source === 'template') {
      edgeWarn(FN, 'llm_fallback', { match_id: matchId })
    }

    const { error: uErr } = await supabase
      .from('match_records')
      .update({ intro_email_draft: intro, updated_at: new Date().toISOString() })
      .eq('id', matchId)
    if (uErr) throw uErr

    edgeLog(FN, 'ok', { match_id: matchId, source })

    return jsonResponse({ intro_email_draft: intro, source })
  } catch (e) {
    edgeErrorObj(FN, 'unhandled_exception', e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
