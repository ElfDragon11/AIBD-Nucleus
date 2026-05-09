import { supabase } from '@/lib/supabase'

import type { CsvImportRecordType } from '@/features/admin/csvImportTargets'

function unwrapFnError(prefix: string, err: unknown): Error {
  if (err instanceof Error && err.message) {
    return new Error(`${prefix}: ${err.message}`)
  }
  return new Error(`${prefix}: unknown error`)
}

export type MapCsvColumnsBody = {
  headers: string[]
  sample_rows: Record<string, unknown>[]
}

export type MapCsvColumnsResult = {
  detected_import_type: CsvImportRecordType
  column_mapping: Record<string, string>
  confidence: number | null
  requires_review: string[]
}

export async function mapCsvColumnsEdge(
  body: MapCsvColumnsBody,
): Promise<MapCsvColumnsResult> {
  const { data, error } = await supabase.functions.invoke<MapCsvColumnsResult>(
    'map-csv-columns',
    { body },
  )
  if (error) throw unwrapFnError('map-csv-columns', error)
  if (
    !data?.column_mapping ||
    (data.detected_import_type !== 'people' &&
      data.detected_import_type !== 'opportunities')
  ) {
    throw new Error('map-csv-columns returned an invalid payload')
  }
  return data
}

export type ProcessCsvImportBody = {
  csv_import_id: string
  approved_mapping: Record<string, string>
  detected_import_type: CsvImportRecordType
}

export type ProcessCsvImportResult = {
  created_count: number
  error_count: number
  row_count: number
}

export async function processCsvImportEdge(
  body: ProcessCsvImportBody,
): Promise<ProcessCsvImportResult> {
  const { data, error } =
    await supabase.functions.invoke<ProcessCsvImportResult>(
      'process-csv-import',
      { body },
    )
  if (error) throw unwrapFnError('process-csv-import', error)
  if (
    data?.created_count === undefined ||
    data?.error_count === undefined ||
    data?.row_count === undefined
  ) {
    throw new Error('process-csv-import returned an invalid payload')
  }
  return data
}
