import {
  ALLOWED_PROFILE_FIELD_KEYS,
  CANONICAL_LEAD_TYPES,
} from './lead_constants.ts'
import type { NextQuestion } from './schemas.ts'
import { nextQuestionSchema } from './schemas.ts'
import { pickFallbackQuestion, normalizePrimaryType } from './fallback_questions.ts'

const SLUG_LIST = CANONICAL_LEAD_TYPES.join(', ')

export function buildClassifySystemPrompt(): string {
  return `You classify incoming leads for Nucleus Connections Hub (Utah innovation ecosystem).
Return a single JSON object only. Do not invent facts — use null or empty arrays when uncertain.

Allowed primary_type and secondary_types values (exact slugs): ${SLUG_LIST}
Every lead has exactly one primary_type and zero or more secondary_types from this list only.

Include first_followup_question: a natural next question with 2-5 short quick-pick options, field_target using snake_case keys like sector, stage, needs, commercialization_goal, ip_status, role_interest, availability, expertise, etc.

Set allow_free_response true and allow_unsure true unless there is a strong reason not to.`
}

export function buildClassifyUserPayload(input: {
  firstName: string | null
  lastName: string | null
  email: string | null
  rawIntent: string
}): string {
  return JSON.stringify({
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    raw_intent: input.rawIntent,
    conversation_summary: 'User just submitted their open-ended intent.',
  })
}

export function buildProcessSystemPrompt(): string {
  const keys = ALLOWED_PROFILE_FIELD_KEYS.join(', ')
  return `You help Nucleus Concierge extract a structured profile from an intake conversation.
Return one JSON object only. Use only information the user provided — never invent facts.

profile_fields: object whose keys MUST be chosen from: ${keys}. Values should be strings, string arrays, or short structured objects with string leaves.

confidence_by_field: numeric 0-1 per key you extracted.

missing_fields: important profile keys still unknown for making good introductions.

should_show_recommendations: true when you have enough signal (usually sector + stage or equivalent, plus their core need/goal) to suggest 2-4 people or opportunities. Err on the side of one more question if major ambiguity remains.

next_question: when should_show_recommendations is false, provide the single best follow-up with 2-5 options, field_target matching an allowed profile key you need most, allow_free_response true, allow_unsure true.

bad_fit_risk optional: low | medium | high if they self-describe as far outside Utah ecosystem intent (still be generous).`
}

export function buildProcessUserPayload(input: {
  lead: Record<string, unknown>
  transcript: string
  profileKeysSoFar: string[]
}): string {
  return JSON.stringify({
    lead: input.lead,
    transcript: input.transcript,
    profile_field_keys_already_stored: input.profileKeysSoFar,
  })
}

export function coerceNextQuestion(raw: unknown, primaryFallback: string | null): NextQuestion {
  const parsed = nextQuestionSchema.safeParse(raw)
  if (parsed.success) {
    let nq = parsed.data
    if (nq.allow_unsure && !nq.options.some((o) => o.includes('not sure'))) {
      const u = "I'm not sure"
      if (!nq.options.includes(u)) {
        nq = { ...nq, options: [...nq.options, u].slice(0, 8) }
      }
    }
    return nq
  }
  const fb = pickFallbackQuestion(
    normalizePrimaryType(primaryFallback) ?? 'researcher_inventor',
    new Set(),
  )
  if (!fb) {
    throw new Error('pickFallbackQuestion returned null with empty fills')
  }
  return fb
}

export function filterSecondaryTypes(types: string[] | null | undefined): string[] {
  if (!types?.length) return []
  const allowed = new Set(CANONICAL_LEAD_TYPES as readonly string[])
  return types.filter((t) => allowed.has(t))
}
