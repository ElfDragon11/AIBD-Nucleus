/** Keys and labels aligned with `supabase/functions/_shared/csv_target_schema.ts`. */

export const IGNORE_FIELD = 'ignore' as const

export type CsvImportRecordType = 'people' | 'opportunities'

export const MAX_CSV_IMPORT_ROWS = 500

export const PEOPLE_IMPORT_FIELDS: { key: string; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'organization', label: 'Organization' },
  { key: 'title', label: 'Title / role' },
  { key: 'bio', label: 'Bio / summary' },
  { key: 'person_types', label: 'Person types' },
  { key: 'sectors', label: 'Sectors' },
  { key: 'skills', label: 'Skills' },
  { key: 'availability', label: 'Availability' },
  { key: 'stage_preferences', label: 'Stage preferences' },
  { key: 'engagement_preferences', label: 'Engagement preferences' },
]

export const OPPORTUNITY_IMPORT_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'organization', label: 'Organization' },
  { key: 'sector', label: 'Sectors' },
  { key: 'stage', label: 'Stage' },
  { key: 'need_types', label: 'Need types' },
]

export function fieldOptionsForImportType(
  t: CsvImportRecordType,
): { key: string; label: string }[] {
  return t === 'people' ? PEOPLE_IMPORT_FIELDS : OPPORTUNITY_IMPORT_FIELDS
}
