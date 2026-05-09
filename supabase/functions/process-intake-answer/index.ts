import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { ProcessIntakeLlmOut } from '../_shared/schemas.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { appendMessage, upsertProfileFieldRow } from '../_shared/db_writes.ts'
import {
  pickFallbackQuestion,
  normalizePrimaryType,
} from '../_shared/fallback_questions.ts'
import { callOpenAiJson } from '../_shared/llm.ts'
import {
  ALLOWED_PROFILE_FIELD_KEYS,
  MAX_ADAPTIVE_ANSWERS,
} from '../_shared/lead_constants.ts'
import {
  buildProcessSystemPrompt,
  buildProcessUserPayload,
  coerceNextQuestion,
} from '../_shared/prompts.ts'
import { processIntakeLlmSchema } from '../_shared/schemas.ts'
import {
  createServiceClient,
  fetchLeadVerified,
} from '../_shared/supabase_admin.ts'

function meanConfidence(m: Record<string, number> | null | undefined): number | null {
  if (!m) return null
  const vals = Object.values(m).filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function isAllowedFieldKey(k: string): boolean {
  return (ALLOWED_PROFILE_FIELD_KEYS as readonly string[]).includes(k)
}

async function loadProfileFieldKeys(
  supabase: SupabaseClient,
  leadId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('lead_profile_fields')
    .select('field_key')
    .eq('lead_id', leadId)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.field_key))
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
      question?: string
      answer?: string
    }
    const leadId = body.lead_id?.trim()
    const sessionId = body.public_session_id?.trim()
    const question = body.question?.trim()
    const answer = body.answer?.trim()
    if (!leadId || !sessionId || !question || !answer) {
      return jsonResponse(
        {
          error:
            'lead_id, public_session_id, question, and answer are required',
        },
        400,
      )
    }

    const supabase = createServiceClient()
    const lead = await fetchLeadVerified(supabase, leadId, sessionId)
    if (!lead) {
      return jsonResponse({ error: 'Lead not found or session invalid' }, 403)
    }

    const primarySlug = normalizePrimaryType(lead.primary_type)

    await appendMessage(supabase, leadId, 'user', answer, {
      kind: 'answer',
      question_text: question,
    })

    const { data: msgRows, error: msgErr } = await supabase
      .from('intake_messages')
      .select('sender, message, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    if (msgErr) throw msgErr

    const userTurns = (msgRows ?? []).filter((r) => r.sender === 'user').length
    const adaptiveAfterThis = Math.max(0, userTurns - 1)

    const filledKeys = await loadProfileFieldKeys(supabase, leadId)
    const transcript = (msgRows ?? [])
      .map((r) => `${r.sender}: ${r.message}`)
      .join('\n')

    const forcedDone = adaptiveAfterThis >= MAX_ADAPTIVE_ANSWERS

    const llm = await callOpenAiJson<Record<string, unknown>>([
      { role: 'system', content: buildProcessSystemPrompt() },
      {
        role: 'user',
        content: buildProcessUserPayload({
          lead,
          transcript,
          profileKeysSoFar: [...filledKeys],
        }),
      },
    ])

    let usedLlm = false
    let showRec = forcedDone
    let profileSummary = lead.ai_summary ?? ''
    let missing: string[] = []
    let badFit: string | null = null
    const updatedFields: Record<string, unknown> = {}
    let rollup: number | null = lead.profile_confidence
    let parsedOut: ProcessIntakeLlmOut | null = null

    if (llm.ok) {
      const pr = processIntakeLlmSchema.safeParse(llm.data)
      if (pr.success) {
        usedLlm = true
        parsedOut = pr.data
        const pf = pr.data.profile_fields ?? {}
        const cf = pr.data.confidence_by_field ?? {}
        profileSummary = pr.data.profile_summary?.trim() ||
          profileSummary ||
          'Updating your profile.'
        missing = (pr.data.missing_fields ?? []).filter(
          (x): x is string => typeof x === 'string',
        )
        if (typeof pr.data.bad_fit_risk === 'string') {
          badFit = pr.data.bad_fit_risk
        }
        if (pr.data.should_show_recommendations === true) {
          showRec = true
        }

        for (const [k, v] of Object.entries(pf)) {
          if (!isAllowedFieldKey(k)) continue
          updatedFields[k] = v
          const c = cf[k]
          await upsertProfileFieldRow(
            supabase,
            leadId,
            k,
            v,
            typeof c === 'number' ? c : null,
          )
        }
        const m = meanConfidence(cf)
        rollup = m ?? rollup
      }
    }

    if (!usedLlm && !forcedDone) {
      rollup = Math.min(rollup ?? 0.4, 0.35)
      profileSummary = profileSummary || lead.ai_summary || ''
    }

    let nextQ = null
    if (!showRec) {
      const nqRaw = parsedOut?.next_question
      if (usedLlm && nqRaw?.question) {
        nextQ = coerceNextQuestion(
          {
            question: nqRaw.question,
            options: nqRaw.options ?? [],
            allow_free_response: nqRaw.allow_free_response ?? true,
            allow_unsure: nqRaw.allow_unsure ?? true,
            field_target: nqRaw.field_target ?? 'needs',
          },
          primarySlug,
        )
      } else {
        const filled = await loadProfileFieldKeys(supabase, leadId)
        nextQ = pickFallbackQuestion(
          primarySlug,
          filled,
          adaptiveAfterThis,
        )
      }
      await appendMessage(supabase, leadId, 'assistant', nextQ.question, {
        kind: 'ai_question',
        question_id: crypto.randomUUID(),
        ...nextQ,
      })
    }

    const leadUpdate: Record<string, unknown> = {
      ai_summary: profileSummary,
      profile_confidence: rollup,
      updated_at: new Date().toISOString(),
    }
    if (badFit) leadUpdate.bad_fit_risk = badFit
    if (showRec) {
      leadUpdate.status = 'intake_complete'
    }

    await supabase.from('leads').update(leadUpdate).eq('id', leadId)

    return jsonResponse({
      updated_fields: updatedFields,
      profile_summary: profileSummary,
      missing_fields: missing,
      should_show_recommendations: showRec,
      next_question: nextQ ?? {},
      candidate_match_count: 0,
    })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
