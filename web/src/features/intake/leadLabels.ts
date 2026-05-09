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
