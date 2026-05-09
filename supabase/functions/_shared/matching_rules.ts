import type { CanonicalLeadType } from './lead_constants.ts'
import { CANONICAL_LEAD_TYPES } from './lead_constants.ts'

/** Opportunity `type` values that can surface for a given lead archetype. */
export const LEAD_TO_OPPORTUNITY_TYPES: Record<
  CanonicalLeadType,
  readonly string[]
> = {
  researcher_inventor: [
    'startup_need',
    'research_project',
    'program',
    'mentorship_need',
    'service_need',
    'advisory_need',
  ],
  startup_founder: [
    'investor_opportunity',
    'advisory_need',
    'service_need',
    'internship',
    'startup_need',
    'program',
  ],
  operator_executive: [
    'advisory_need',
    'startup_need',
    'research_project',
    'internship',
    'program',
  ],
  mentor: ['startup_need', 'mentorship_need', 'program', 'research_project', 'internship'],
  subject_matter_expert: ['startup_need', 'research_project', 'advisory_need', 'mentorship_need'],
  investor_venture: ['startup_need', 'investor_opportunity', 'advisory_need'],
  service_provider: ['startup_need', 'research_project', 'service_need', 'mentorship_need'],
  student_intern: ['internship', 'program', 'mentorship_need', 'startup_need', 'research_project'],
}

/** Person `person_types` tokens that are acceptable for the lead. */
export const LEAD_TO_PERSON_TYPE_TOKENS: Record<
  CanonicalLeadType,
  readonly string[]
> = {
  researcher_inventor: [
    'mentor',
    'advisor',
    'operator',
    'expert',
    'student',
    'researcher',
    'service_provider',
  ],
  startup_founder: [
    'mentor',
    'operator',
    'investor',
    'expert',
    'founder',
    'executive',
    'service_provider',
    'student',
  ],
  operator_executive: [
    'founder',
    'executive',
    'mentor',
    'researcher',
  ],
  mentor: ['founder', 'researcher', 'student', 'executive'],
  subject_matter_expert: ['founder', 'researcher', 'executive', 'mentor'],
  investor_venture: ['founder', 'executive', 'mentor'],
  service_provider: ['founder', 'researcher', 'executive', 'mentor'],
  student_intern: ['mentor', 'founder', 'researcher', 'student', 'executive', 'investor'],
}

export function coerceLeadType(
  raw: string | null | undefined,
): CanonicalLeadType {
  if (!raw) return 'researcher_inventor'
  const s = raw.trim()
  if ((CANONICAL_LEAD_TYPES as readonly string[]).includes(s)) {
    return s as CanonicalLeadType
  }
  return 'researcher_inventor'
}

export function personPassesHardFilter(
  lead: CanonicalLeadType,
  personTypes: string[] | null,
): boolean {
  const allowed = LEAD_TO_PERSON_TYPE_TOKENS[lead]
  const pt = personTypes ?? []
  if (pt.length === 0) return true
  return pt.some((t) => allowed.includes(t))
}

export function opportunityPassesHardFilter(
  lead: CanonicalLeadType,
  oppType: string,
): boolean {
  return (LEAD_TO_OPPORTUNITY_TYPES[lead] as readonly string[]).includes(oppType)
}
