import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { appendMessage, upsertProfileFieldRow } from '../_shared/db_writes.ts'
import { edgeErrorObj, edgeLog, edgeWarn, previewText } from '../_shared/edge_logger.ts'
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
import { classifyLlmSchema, type NextQuestion } from '../_shared/schemas.ts'
import {
  createServiceClient,
  fetchLeadVerified,
} from '../_shared/supabase_admin.ts'

function isAllowedFieldKey(k: string): boolean {
  return (ALLOWED_PROFILE_FIELD_KEYS as readonly string[]).includes(k)
}

const FN = 'classify-lead'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    edgeWarn(FN, 'method_not_allowed', { method: req.method })
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
      edgeWarn(FN, 'bad_request', { hint: 'need lead_id, public_session_id, raw_intent' })
      return jsonResponse(
        { error: 'lead_id, public_session_id, and raw_intent are required' },
        400,
      )
    }

    edgeLog(FN, 'request_received', {
      lead_id: leadId,
      intent_chars: rawIntent.length,
      intent_preview: previewText(rawIntent),
    })

    const supabase = createServiceClient()
    const lead = await fetchLeadVerified(supabase, leadId, sessionId)
    if (!lead) {
      edgeWarn(FN, 'session_invalid_or_lead_missing', { lead_id: leadId })
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
    let llmReturnedFollowupDraft = false
    let primary: CanonicalLeadType | null = null
    let secondary: string[] = []
    let conf = 0.45
    let tags: string[] = []
    let firstQ: NextQuestion | null = null

    if (!llm.ok) {
      edgeWarn(FN, 'openai_classifier_failed', { reason_preview: previewText(llm.error) })
    }

    if (llm.ok) {
      const lp = classifyLlmSchema.safeParse(llm.data)
      if (lp.success) {
        usedLlm = true
        primary = normalizePrimaryType(lp.data.primary_type) ?? null
        secondary = filterSecondaryTypes(lp.data.secondary_types ?? undefined)
        conf = typeof lp.data.confidence === 'number' &&
            Number.isFinite(lp.data.confidence)
          ? lp.data.confidence
          : 0.55
        tags = (lp.data.suggested_tags ?? []).filter(
          (t): t is string => typeof t === 'string' && t.length > 0,
        )
        const ff = lp.data.first_followup_question
        if (ff?.question) {
          llmReturnedFollowupDraft = true
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
        }
      } else {
        edgeWarn(FN, 'classifier_json_failed_schema', {
          zod_issues: lp.error.issues.length,
          zod_first_issue: lp.error.issues[0]?.message ?? 'unknown',
        })
      }
    }

    const llmPrimary = primary
    const heuristicPrimary = inferPrimaryFromIntentText(rawIntent)
    primary =
      primary ??
      heuristicPrimary ??
      'researcher_inventor'

    if (!usedLlm) {
      conf = Math.min(conf, 0.35)
    }

    if (!firstQ) {
      firstQ = pickFallbackQuestion(primary, new Set())
    }
    if (!firstQ) {
      throw new Error('classify-lead: no first question after classification')
    }

    edgeLog(FN, 'classification_resolved', {
      lead_id: leadId,
      used_llm_classifier: usedLlm,
      llm_primary_type: llmPrimary,
      heuristic_primary_if_used: llmPrimary == null ? heuristicPrimary ?? null : null,
      resolved_primary_type: primary,
      first_question_source:
        llmReturnedFollowupDraft ? 'coerced_llm_followup_or_schema_default' : 'static_ladder',
      first_followup_field_target: firstQ.field_target,
      confidence_post_cap: conf,
    })

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

    edgeLog(FN, 'response_ok', { lead_id: leadId })

    return jsonResponse({
      primary_type: primary,
      secondary_types: secondary,
      confidence: conf,
      initial_tags: tags,
      next_question: firstQ,
    })
  } catch (e) {
    edgeErrorObj(FN, 'unhandled_exception', e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
