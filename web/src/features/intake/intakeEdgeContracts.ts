/**
 * Phase 4 Edge Function request/response shapes (anonymous browser → Supabase Edge).
 * Backend validates `lead_id` + `public_session_id` together (must match rows in `public.leads`).
 *
 * Secrets: OPENAI_* and SUPABASE_* are Edge-only — never expose service role keys in the browser.
 */

/** classify-lead */
export type ClassifyLeadBody = {
  lead_id: string
  public_session_id: string
  raw_intent: string
}

export type NextQuestionPayload = {
  question: string
  options: string[]
  allow_free_response: boolean
  allow_unsure: boolean
  field_target: string
}

export type ClassifyLeadResult = {
  primary_type: string
  secondary_types: string[]
  confidence: number
  initial_tags: string[]
  next_question: NextQuestionPayload
}

/** process-intake-answer */
export type ProcessIntakeAnswerBody = {
  lead_id: string
  public_session_id: string
  /** Last question text shown to the user (verbatim assistant turn). */
  question: string
  /** Normalized combined answer text from quick pick + notes. */
  answer: string
}

export type ProcessIntakeAnswerResult = {
  updated_fields: Record<string, unknown>
  profile_summary: string
  missing_fields: string[]
  should_show_recommendations: boolean
  next_question: NextQuestionPayload | Record<string, never>
  candidate_match_count: number
}
