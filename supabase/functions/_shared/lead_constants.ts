/** Phase 0.2 canonical slugs — must match DB check on leads.primary_type */
export const CANONICAL_LEAD_TYPES = [
  'researcher_inventor',
  'startup_founder',
  'operator_executive',
  'mentor',
  'subject_matter_expert',
  'investor_venture',
  'service_provider',
  'student_intern',
] as const

export type CanonicalLeadType = (typeof CANONICAL_LEAD_TYPES)[number]

export const ALLOWED_PROFILE_FIELD_KEYS = [
  'sector',
  'stage',
  'availability',
  'risk_tolerance',
  'commercialization_goal',
  'role_interest',
  'expertise',
  'university',
  'ip_status',
  'funding_status',
  'needs',
  'target_customer',
  'engagement_preferences',
  'stage_preferences',
  'intent_summary',
  'geo_focus',
  'organization_type',
] as const

export type ProfileFieldKey = (typeof ALLOWED_PROFILE_FIELD_KEYS)[number]

/** Max adaptive answers after intent before forcing recommendations */
export const MAX_ADAPTIVE_ANSWERS = 11
