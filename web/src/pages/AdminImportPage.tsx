import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import Papa from 'papaparse'
import { Link, useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import {
  mapCsvColumnsEdge,
  processCsvImportEdge,
} from '@/features/admin/csvImportApi'
import {
  fieldOptionsForImportType,
  IGNORE_FIELD,
  MAX_CSV_IMPORT_ROWS,
  type CsvImportRecordType,
} from '@/features/admin/csvImportTargets'
import type { Json } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

type Step = 'upload' | 'preview' | 'mapping' | 'processing' | 'done'

function sanitizeMappingForType(
  mapping: Record<string, string>,
  headers: string[],
  importType: CsvImportRecordType,
): Record<string, string> {
  const allowed = new Set(
    fieldOptionsForImportType(importType).map((f) => f.key),
  )
  allowed.add(IGNORE_FIELD)
  const next: Record<string, string> = {}
  for (const h of headers) {
    const v = mapping[h] ?? IGNORE_FIELD
    next[h] = allowed.has(v) ? v : IGNORE_FIELD
  }
  return next
}

export function AdminImportPage() {
  const { session } = useOutletContext<{ session: Session }>()

  const [step, setStep] = React.useState<Step>('upload')
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [headers, setHeaders] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [pageError, setPageError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const [importId, setImportId] = React.useState<string | null>(null)
  const [importType, setImportType] = React.useState<CsvImportRecordType>('people')
  const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>(
    {},
  )
  const [requiresReview, setRequiresReview] = React.useState<string[]>([])
  const [confidence, setConfidence] = React.useState<number | null>(null)

  const [processResult, setProcessResult] = React.useState<{
    created_count: number
    error_count: number
    row_count: number
  } | null>(null)
  const [failedRows, setFailedRows] = React.useState<
    { row_index: number | null; error_message: string | null }[]
  >([])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const resetAll = () => {
    setStep('upload')
    setFileName(null)
    setHeaders([])
    setRows([])
    setParseError(null)
    setPageError(null)
    setImportId(null)
    setImportType('people')
    setColumnMapping({})
    setRequiresReview([])
    setConfidence(null)
    setProcessResult(null)
    setFailedRows([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onFile = (file: File | null) => {
    setParseError(null)
    setPageError(null)
    if (!file) return

    setFileName(file.name)
    setBusy(true)
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        setBusy(false)
        if (result.errors?.length) {
          const msg = result.errors.map((e) => e.message).join('; ')
          setParseError(msg || 'CSV parse error')
          return
        }
        const fields = (result.meta.fields ?? []).filter(
          (f): f is string => Boolean(f?.trim()),
        )
        if (!fields.length) {
          setParseError('No header row found.')
          return
        }
        const data = (result.data ?? []).filter((row) => {
          return Object.values(row).some((v) => String(v ?? '').trim() !== '')
        })
        if (data.length > MAX_CSV_IMPORT_ROWS) {
          setParseError(
            `This file has ${data.length} rows. Maximum per import is ${MAX_CSV_IMPORT_ROWS}.`,
          )
          return
        }
        setHeaders(fields)
        setRows(data)
        setStep('preview')
      },
      error: (err) => {
        setBusy(false)
        setParseError(err.message)
      },
    })
  }

  const loadAdminId = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Your account is not in admin_users.')
    return data.id
  }, [session.user.id])

  const persistAndMap = async () => {
    setPageError(null)
    setBusy(true)
    try {
      const adminId = await loadAdminId()
      const { data: job, error: jobErr } = await supabase
        .from('csv_imports')
        .insert({
          admin_user_id: adminId,
          file_name: fileName,
          status: 'uploaded',
          row_count: rows.length,
        })
        .select('id')
        .single()
      if (jobErr || !job) throw jobErr ?? new Error('Failed to create import job')

      const chunk = 150
      for (let i = 0; i < rows.length; i += chunk) {
        const slice = rows.slice(i, i + chunk)
        const payload = slice.map((raw, j) => ({
          csv_import_id: job.id,
          row_index: i + j,
          raw_data: raw as Json,
          status: 'pending' as const,
        }))
        const { error: rowErr } = await supabase
          .from('csv_import_rows')
          .insert(payload)
        if (rowErr) throw rowErr
      }

      setImportId(job.id)

      const sample = rows.slice(0, 12)
      const mapped = await mapCsvColumnsEdge({ headers, sample_rows: sample })
      setImportType(mapped.detected_import_type)
      setColumnMapping(
        sanitizeMappingForType(mapped.column_mapping, headers, mapped.detected_import_type),
      )
      setRequiresReview(mapped.requires_review ?? [])
      setConfidence(mapped.confidence ?? null)
      setStep('mapping')
    } catch (e) {
      setPageError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onImportTypeChange = (next: CsvImportRecordType) => {
    setImportType(next)
    setColumnMapping((prev) => sanitizeMappingForType(prev, headers, next))
  }

  const runImport = async () => {
    if (!importId) return
    setPageError(null)
    setStep('processing')
    setBusy(true)
    try {
      const approved_mapping = sanitizeMappingForType(
        columnMapping,
        headers,
        importType,
      )
      const { error: upErr } = await supabase
        .from('csv_imports')
        .update({
          column_mapping: approved_mapping,
          detected_import_type: importType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', importId)
      if (upErr) throw upErr

      const result = await processCsvImportEdge({
        csv_import_id: importId,
        approved_mapping,
        detected_import_type: importType,
      })
      setProcessResult(result)

      const { data: fails, error: fErr } = await supabase
        .from('csv_import_rows')
        .select('row_index, error_message')
        .eq('csv_import_id', importId)
        .eq('status', 'error')
      if (fErr) throw fErr
      setFailedRows(
        (fails ?? []).map((r) => ({
          row_index: r.row_index,
          error_message: r.error_message,
        })),
      )
      setStep('done')
    } catch (e) {
      setPageError(e instanceof Error ? e.message : String(e))
      setStep('mapping')
    } finally {
      setBusy(false)
    }
  }

  const previewCols = headers
  const previewRows = rows.slice(0, 20)
  const fieldOpts = fieldOptionsForImportType(importType)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CSV import</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CRM export, map columns with AI assistance, then import people or
            opportunities for matching.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={resetAll}>
          Start over
        </Button>
      </div>

      {(parseError || pageError) && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {parseError ?? pageError}
        </div>
      )}

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Upload file</CardTitle>
            <CardDescription>
              UTF-8 CSV with a header row. Maximum {MAX_CSV_IMPORT_ROWS} data rows per
              import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="text-sm"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Parsing…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Preview</CardTitle>
            <CardDescription>
              {fileName} — {rows.length} rows, {headers.length} columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[360px] overflow-auto rounded-md border border-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    {previewCols.map((h) => (
                      <th
                        key={h}
                        className="border-b border-border px-2 py-2 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {previewCols.map((h) => (
                        <td
                          key={h}
                          className="max-w-[200px] truncate px-2 py-1.5 text-muted-foreground"
                          title={String(row[h] ?? '')}
                        >
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={() => void persistAndMap()}>
                {busy ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                    Saving &amp; mapping…
                  </>
                ) : (
                  'Save rows & suggest mapping'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Column mapping</CardTitle>
            <CardDescription>
              AI suggested a layout
              {confidence != null ? ` (confidence ${Math.round(confidence * 100)}%)` : ''}.
              Adjust targets, then run the import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid max-w-md gap-2">
              <Label htmlFor="import-type">Record type</Label>
              <select
                id="import-type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={importType}
                onChange={(e) =>
                  onImportTypeChange(e.target.value as CsvImportRecordType)
                }
              >
                <option value="people">People (contacts)</option>
                <option value="opportunities">Opportunities</option>
              </select>
            </div>

            <div className="space-y-3">
              {headers.map((h) => {
                const review = requiresReview.includes(h)
                return (
                  <div
                    key={h}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={h}>
                        {h}
                      </p>
                      {review && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          Flagged for review
                        </p>
                      )}
                    </div>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs"
                      value={columnMapping[h] ?? IGNORE_FIELD}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [h]: e.target.value,
                        }))
                      }
                    >
                      <option value={IGNORE_FIELD}>Ignore</option>
                      {fieldOpts.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={() => void runImport()}>
                {busy ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                    Importing…
                  </>
                ) : (
                  'Run import'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" aria-hidden />
            Processing rows and generating embeddings…
          </CardContent>
        </Card>
      )}

      {step === 'done' && processResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Results</CardTitle>
            <CardDescription>
              Imported {processResult.created_count} of {processResult.row_count} rows.
              {processResult.error_count > 0
                ? ` ${processResult.error_count} row(s) failed.`
                : ' No errors.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/admin/people"
                className="font-medium text-primary hover:underline"
              >
                View people
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                to="/admin/opportunities"
                className="font-medium text-primary hover:underline"
              >
                View opportunities
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              In People, filter source to &quot;CSV import&quot; to see new contacts.
            </p>
            {failedRows.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Failed rows</p>
                <ul className="max-h-48 list-inside list-disc space-y-1 overflow-auto text-xs text-muted-foreground">
                  {failedRows.map((r, i) => (
                    <li key={i}>
                      Row {(r.row_index ?? 0) + 1}: {r.error_message ?? 'Unknown error'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button type="button" variant="outline" onClick={resetAll}>
              Import another file
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
