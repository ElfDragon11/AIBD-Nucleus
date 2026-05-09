/** CSV import: mappable fields aligned with `people` / `opportunities` inserts. */

export const CSV_IMPORT_SOURCE = 'csv_import' as const
export const IGNORE_COLUMN = 'ignore' as const

export type ImportRecordType = 'people' | 'opportunities'

export type FieldSpec = {
  key: string
  label: string
  required: boolean
  kind: 'string' | 'string[]'
  description: string
}

export const PEOPLE_CSV_FIELDS: FieldSpec[] = [
  {
    key: 'first_name',
    label: 'First name',
    required: false,
    kind: 'string',
    description: 'Given name',
  },
  {
    key: 'last_name',
    label: 'Last name',
    required: false,
    kind: 'string',
    description: 'Family name',
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    kind: 'string',
    description: 'Work or primary email',
  },
  {
    key: 'organization',
    label: 'Organization',
    required: false,
    kind: 'string',
    description: 'Company, university, or affiliation',
  },
  {
    key: 'title',
    label: 'Title / role',
    required: false,
    kind: 'string',
    description: 'Job title',
  },
  {
    key: 'bio',
    label: 'Bio / summary',
    required: false,
    kind: 'string',
    description: 'Narrative summary',
  },
  {
    key: 'person_types',
    label: 'Person types',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated tags (e.g. researcher, operator)',
  },
  {
    key: 'sectors',
    label: 'Sectors',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated sectors or industries',
  },
  {
    key: 'skills',
    label: 'Skills',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated skills',
  },
  {
    key: 'availability',
    label: 'Availability',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated availability modes',
  },
  {
    key: 'stage_preferences',
    label: 'Stage preferences',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated venture stages of interest',
  },
  {
    key: 'engagement_preferences',
    label: 'Engagement preferences',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated engagement styles',
  },
]

export const OPPORTUNITY_CSV_FIELDS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Name',
    required: true,
    kind: 'string',
    description: 'Opportunity title or headline',
  },
  {
    key: 'type',
    label: 'Type',
    required: false,
    kind: 'string',
    description:
      'Slug such as startup_need, research_project, investor_mandate, campus_program',
  },
  {
    key: 'description',
    label: 'Description',
    required: false,
    kind: 'string',
    description: 'Longer narrative',
  },
  {
    key: 'organization',
    label: 'Organization',
    required: false,
    kind: 'string',
    description: 'Owning org or team name',
  },
  {
    key: 'sector',
    label: 'Sectors',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated sectors',
  },
  {
    key: 'stage',
    label: 'Stage',
    required: false,
    kind: 'string',
    description: 'Venture or program stage slug',
  },
  {
    key: 'need_types',
    label: 'Need types',
    required: false,
    kind: 'string[]',
    description: 'Comma-separated needs (mentorship, capital, etc.)',
  },
]

export function fieldSpecsForType(t: ImportRecordType): FieldSpec[] {
  return t === 'people' ? PEOPLE_CSV_FIELDS : OPPORTUNITY_CSV_FIELDS
}

export function allowedTargetsForType(t: ImportRecordType): Set<string> {
  const s = new Set(fieldSpecsForType(t).map((f) => f.key))
  s.add(IGNORE_COLUMN)
  return s
}

/** Compact JSON for LLM system context. */
export function buildTargetSchemaForLlm(): Record<string, unknown> {
  return {
    people: Object.fromEntries(
      PEOPLE_CSV_FIELDS.map((f) => [
        f.key,
        {
          label: f.label,
          required: f.required,
          kind: f.kind,
          hint: f.description,
        },
      ]),
    ),
    opportunities: Object.fromEntries(
      OPPORTUNITY_CSV_FIELDS.map((f) => [
        f.key,
        {
          label: f.label,
          required: f.required,
          kind: f.kind,
          hint: f.description,
        },
      ]),
    ),
  }
}

export const MAX_CSV_IMPORT_ROWS = 500

export function parseListCell(raw: unknown): string[] | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const out = raw.map((x) => String(x).trim()).filter(Boolean)
    return out.length ? out : null
  }
  const s = String(raw).trim()
  if (!s) return null
  const parts = s.split(/[,;|]/).map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts : null
}

export function parseScalarCell(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  return s.length ? s : null
}

export function personHasIdentity(mapped: Record<string, unknown>): boolean {
  const fn = parseScalarCell(mapped.first_name)
  const ln = parseScalarCell(mapped.last_name)
  const em = parseScalarCell(mapped.email)
  return Boolean(fn || ln || em)
}
