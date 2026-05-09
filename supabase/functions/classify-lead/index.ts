import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { appendMessage, upsertProfileFieldRow } from '../_shared/db_writes.ts'
import {
  pickFallbackQuestion,
  normalizePrimaryType,
  type CanonicalLeadType,
} from '../_shared/fallback_questions.ts'
import { inferPrimaryFromIntentText } from '../_shared/intent_heuristics.ts'
import { callOpenAiJson } from '../_shared/llm.ts'
import { ALLOWED_PROFILE_FIELD_KEYS } from '../_shared/lead_constants.ts'
import {
  buildClassifySystemPrompt,
  buildClassifyUserPayload,
  coerceNextQuestion,
  filterSecondaryTypes,
} from '../_shared/prompts.ts'
import { classifyLlmSchema } from '../_shared/schemas.ts'
import {
  createServiceClient,
  fetchLeadVerified,
} from '../_shared/supabase_admin.ts'

function isAllowedFieldKey(k: string): boolean {
  return (ALLOWED_PROFILE_FIELD_KEYS as readonly string[]).includes(k)
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
      raw_intent?: string
    }
    const leadId = body.lead_id?.trim()
    const sessionId = body.public_session_id?.trim()
    const rawIntent = body.raw_intent?.trim()
    if (!leadId || !sessionId || !rawIntent) {
      return jsonResponse(
        { error: 'lead_id, public_session_id, and raw_intent are required' },
        400,
      )
    }

    const supabase = createServiceClient()
    const lead = await fetchLeadVerified(supabase, leadId, sessionId)
    if (!lead) {
      return jsonResponse({ error: 'Lead not found or session invalid' }, 403)
    }

    await supabase
      .from('leads')
      .update({ raw_intent: rawIntent, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    const llm = await callOpenAiJson<Record<string, unknown>>([
      { role: 'system', content: buildClassifySystemPrompt() },
      {
        role: 'user',
        content: buildClassifyUserPayload({
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email,
          rawIntent,
        }),
      },
    ])

    let usedLlm = false
    let primary: CanonicalLeadType | null = null
    let secondary: string[] = []
    let conf = 0.45
    let tags: string[] = []
    let firstQ =
      pickFallbackQuestion('researcher_inventor', new Set()) ??
      FALLBACK_QUESTIONS.researcher_inventor[0] as Omit<FallbackTemplate, never> &
        NextQuestion

    if (llm.ok) {
      const lp = classifyLlmSchema.safeParse(llm.data)
      if (lp.success) {
        usedLlm = true
        primary = normalizePrimaryType(lp.data.primary_type) ?? null
        secondary = filterSecondaryTypes(lp.data.secondary_types ?? undefined)
        conf = typeof lp.data.confidence === 'number' ? lp.data.confidence : 0.55
        tags = (lp.data.suggested_tags ?? []).filter(
          (t): t is string => typeof t === 'string' && t.length > 0,
        )
        const ff = lp.data.first_followup_question
        if (ff?.question) {
          firstQ = coerceNextQuestion(
            {
              question: ff.question,
              options: ff.options ?? [],
              allow_free_response: ff.allow_free_response ?? true,
              allow_unsure: ff.allow_unsure ?? true,
              field_target: ff.field_target ?? 'needs',
            },
            primary,
          )
        } else {
          firstQ = pickFallbackQuestion(primary, new Set(), 0)
        }
      }
    }

    primary = primary ?? 'researcher_inventor'
    if (!usedLlm) {
      conf = Math.min(conf, 0.35)
      firstQ = pickFallbackQuestion(primary, new Set(), 0)
    }

    await supabase
      .from('leads')
      .update({
        primary_type: primary,
        secondary_types: secondary.length > 0 ? secondary : [],
        raw_intent: rawIntent,
        profile_confidence: conf,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (usedLlm && llm.ok) {
      const lp = classifyLlmSchema.safeParse(llm.data)
      if (lp.success) {
        const sector = lp.data.sector_guess
        if (sector && isAllowedFieldKey('sector')) {
          await upsertProfileFieldRow(
            supabase,
            leadId,
            'sector',
            sector,
            conf * 0.85,
          )
        }
        const stage = lp.data.stage_guess
        if (stage && isAllowedFieldKey('stage')) {
          await upsertProfileFieldRow(
            supabase,
            leadId,
            'stage',
            stage,
            conf * 0.85,
          )
        }
        const ig = lp.data.intent_guess
        if (ig && isAllowedFieldKey('intent_summary')) {
          await upsertProfileFieldRow(
            supabase,
            leadId,
            'intent_summary',
            ig,
            conf * 0.9,
          )
        }
      }
    }

    await appendMessage(supabase, leadId, 'system', `Classification: primary=${primary}` +
      (!usedLlm ? ' (degraded_fallback)' : ''), {
      kind: 'classification',
      primary_type: primary,
      secondary_types: secondary,
      confidence: conf,
      llm_ok: usedLlm,
    })

    await appendMessage(supabase, leadId, 'assistant', firstQ.question, {
      kind: 'ai_question',
      question_id: crypto.randomUUID(),
      ...firstQ,
    })

    return jsonResponse({
      primary_type: primary,
      secondary_types: secondary,
      confidence: conf,
      initial_tags: tags,
      next_question: firstQ,
    })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
