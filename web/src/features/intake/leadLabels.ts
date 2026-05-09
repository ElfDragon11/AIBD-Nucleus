/** Phase 0.2 display labels — slugs elsewhere in DB. */
export const PRIMARY_TYPE_LABELS: Record<string, string> = {
  researcher_inventor: 'Researcher / Inventor',
  startup_founder: 'Startup / Founder',
  operator_executive: 'Operator / Executive',
  mentor: 'Mentor',
  subject_matter_expert: 'Subject-Matter Expert',
  investor_venture: 'Investor / Venture',
  service_provider: 'Service Provider',
  student_intern: 'Student / Intern',
}

export function primaryTypeDisplay(slug: string | null): string | null {
  if (!slug) return null
  return PRIMARY_TYPE_LABELS[slug] ?? slug.replace(/_/g, ' ')
}

/** Recommendation reveal hero — tuned to classified primary type. */
const RECOMMENDATION_HEADLINES: Record<string, string> = {
  researcher_inventor:
    "We think you'll like these people who connect serious research with what happens next in the market.",
  startup_founder:
    "We think you'll like these operators and advisors for the stage your company is in.",
  operator_executive:
    "We think you'll like these founder teams and roles that fit how you lead.",
  mentor:
    "We think you'll like these builders who are ready for the kind of guidance you bring.",
  subject_matter_expert:
    "We think you'll like these conversations where your depth of expertise really shows.",
  investor_venture:
    "We think you'll like these founders and opportunities that line up with how you invest.",
  service_provider:
    "We think you'll like meeting these teams who could use what you deliver.",
  student_intern:
    "We think you'll like these mentors and paths we surfaced for where you're headed.",
}

export function recommendationHeadlineForPrimaryType(slug: string): string {
  return (
    RECOMMENDATION_HEADLINES[slug] ??
    "We think you'll like these introductions we picked from what you shared."
  )
}
