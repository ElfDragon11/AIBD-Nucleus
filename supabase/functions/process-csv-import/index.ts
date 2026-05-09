import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { verifyAdminFromRequest } from '../_shared/admin_auth.ts'
import {
  CSV_IMPORT_SOURCE,
  fieldSpecsForType,
  IGNORE_COLUMN,
  MAX_CSV_IMPORT_ROWS,
  parseListCell,
  parseScalarCell,
  personHasIdentity,
  type FieldSpec,
  type ImportRecordType,
} from '../_shared/csv_target_schema.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { edgeErrorObj, edgeLog, edgeWarn } from '../_shared/edge_logger.ts'
import { embedText } from '../_shared/embeddings.ts'
import { createServiceClient } from '../_shared/supabase_admin.ts'

const FN = 'process-csv-import'

function toPgVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}

function buildMapped(
  raw: Record<string, unknown>,
  mapping: Record<string, string>,
  fields: FieldSpec[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [csvCol, target] of Object.entries(mapping)) {
    if (target === IGNORE_COLUMN) continue
    const spec = fields.find((f) => f.key === target)
    if (!spec) continue
    const cell = raw[csvCol]
    if (spec.kind === 'string[]') {
      const v = parseListCell(cell)
      if (v?.length) out[target] = v
    } else {
      const v = parseScalarCell(cell)
      if (v) out[target] = v
    }
  }
  return out
}

function buildPersonEmbeddingText(m: Record<string, unknown>): string {
  const lines: string[] = []
  const fn = parseScalarCell(m.first_name)
  const ln = parseScalarCell(m.last_name)
  const name = [fn, ln].filter(Boolean).join(' ')
  if (name) lines.push(name)
  const org = parseScalarCell(m.organization)
  if (org) lines.push(`Organization: ${org}`)
  const title = parseScalarCell(m.title)
  if (title) lines.push(`Title: ${title}`)
  const email = parseScalarCell(m.email)
  if (email) lines.push(`Email: ${email}`)
  for (
    const key of [
      'person_types',
      'sectors',
      'skills',
      'availability',
      'stage_preferences',
      'engagement_preferences',
    ] as const
  ) {
    const arr = m[key]
    if (Array.isArray(arr) && arr.length) {
      lines.push(`${key}: ${(arr as string[]).join(', ')}`)
    }
  }
  const bio = parseScalarCell(m.bio)
  if (bio) lines.push(bio)
  return lines.join('\n').trim().slice(0, 12000)
}

function buildOppEmbeddingText(m: Record<string, unknown>): string {
  const lines: string[] = []
  const name = parseScalarCell(m.name)
  if (name) lines.push(name)
  const org = parseScalarCell(m.organization)
  if (org) lines.push(`Organization: ${org}`)
  const typ = parseScalarCell(m.type)
  if (typ) lines.push(`Type: ${typ}`)
  const stage = parseScalarCell(m.stage)
  if (stage) lines.push(`Stage: ${stage}`)
  const sec = m.sector
  if (Array.isArray(sec) && sec.length) {
    lines.push(`Sectors: ${(sec as string[]).join(', ')}`)
  }
  const needs = m.need_types
  if (Array.isArray(needs) && needs.length) {
    lines.push(`Needs: ${(needs as string[]).join(', ')}`)
  }
  const desc = parseScalarCell(m.description)
  if (desc) lines.push(desc)
  return lines.join('\n').trim().slice(0, 12000)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    edgeWarn(FN, 'method_not_allowed', { method: req.method })
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await verifyAdminFromRequest(req)
  if (!auth.ok) {
    edgeWarn(FN, 'auth_failed', { status: auth.status })
    return jsonResponse({ error: auth.message }, auth.status)
  }

  let importIdMarkFailed: string | null = null

  try {
    const body = (await req.json()) as {
      csv_import_id?: string
      approved_mapping?: Record<string, string> | null
      detected_import_type?: ImportRecordType
    }
    const csvImportId = body.csv_import_id?.trim()
    const detected_import_type = body.detected_import_type
    const approved_mapping = body.approved_mapping

    if (!csvImportId) {
      return jsonResponse({ error: 'csv_import_id is required' }, 400)
    }
    if (detected_import_type !== 'people' && detected_import_type !== 'opportunities') {
      return jsonResponse({ error: 'detected_import_type must be people or opportunities' }, 400)
    }
    if (!approved_mapping || typeof approved_mapping !== 'object') {
      return jsonResponse({ error: 'approved_mapping is required' }, 400)
    }

    const supabase = createServiceClient()

    const { data: job, error: jobErr } = await supabase
      .from('csv_imports')
      .select('id, admin_user_id')
      .eq('id', csvImportId)
      .maybeSingle()

    if (jobErr || !job) {
      return jsonResponse({ error: 'Import job not found' }, 404)
    }
    if (job.admin_user_id !== auth.adminUserId) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { count, error: cntErr } = await supabase
      .from('csv_import_rows')
      .select('id', { count: 'exact', head: true })
      .eq('csv_import_id', csvImportId)

    if (cntErr) {
      edgeErrorObj(FN, 'count_failed', { error: cntErr.message })
      return jsonResponse({ error: cntErr.message }, 500)
    }

    const total = count ?? 0
    if (total > MAX_CSV_IMPORT_ROWS) {
      return jsonResponse(
        {
          error: `Too many rows (${total}). Maximum per import is ${MAX_CSV_IMPORT_ROWS}.`,
        },
        400,
      )
    }

    const { data: rows, error: rowsErr } = await supabase
      .from('csv_import_rows')
      .select('id, row_index, raw_data')
      .eq('csv_import_id', csvImportId)
      .order('row_index', { ascending: true, nullsFirst: true })

    if (rowsErr || !rows) {
      edgeErrorObj(FN, 'rows_load_failed', { error: rowsErr?.message })
      return jsonResponse({ error: rowsErr?.message ?? 'Failed to load rows' }, 500)
    }

    await supabase
      .from('csv_imports')
      .update({
        status: 'processing',
        column_mapping: approved_mapping as unknown,
        detected_import_type,
        row_count: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', csvImportId)

    importIdMarkFailed = csvImportId

    const fields = fieldSpecsForType(detected_import_type)
    let created_count = 0
    let error_count = 0

    edgeLog(FN, 'processing_start', {
      import_id: csvImportId,
      rows: rows.length,
      type: detected_import_type,
    })

    for (const row of rows) {
      const raw = row.raw_data
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        error_count++
        await supabase
          .from('csv_import_rows')
          .update({
            status: 'error',
            error_message: 'Invalid or empty raw_data',
            mapped_data: null,
          })
          .eq('id', row.id)
        continue
      }

      const rawObj = raw as Record<string, unknown>
      const mapped = buildMapped(rawObj, approved_mapping, fields)

      if (detected_import_type === 'people') {
        if (!personHasIdentity(mapped)) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message:
                'People rows need at least one of: first_name, last_name, email',
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        const insertPayload = {
          lead_id: null as string | null,
          first_name: parseScalarCell(mapped.first_name),
          last_name: parseScalarCell(mapped.last_name),
          email: parseScalarCell(mapped.email),
          organization: parseScalarCell(mapped.organization),
          title: parseScalarCell(mapped.title),
          bio: parseScalarCell(mapped.bio),
          person_types: (mapped.person_types as string[] | null) ?? null,
          sectors: (mapped.sectors as string[] | null) ?? null,
          skills: (mapped.skills as string[] | null) ?? null,
          availability: (mapped.availability as string[] | null) ?? null,
          stage_preferences: (mapped.stage_preferences as string[] | null) ?? null,
          engagement_preferences:
            (mapped.engagement_preferences as string[] | null) ?? null,
          source: CSV_IMPORT_SOURCE,
          status: 'active',
        }

        const embeddingText = buildPersonEmbeddingText(mapped)
        const textForEmbed = embeddingText.length > 0
          ? embeddingText
          : [insertPayload.first_name, insertPayload.last_name, insertPayload.organization]
            .filter(Boolean)
            .join(' ')

        const emb = await embedText(textForEmbed)
        if (!emb.ok) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message: `Embedding failed: ${emb.error}`,
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        const { data: ins, error: insErr } = await supabase
          .from('people')
          .insert({
            ...insertPayload,
            embedding_text: textForEmbed.slice(0, 8000),
            embedding: toPgVectorLiteral(emb.vector),
          })
          .select('id')
          .single()

        if (insErr || !ins) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message: insErr?.message ?? 'Insert failed',
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        created_count++
        await supabase
          .from('csv_import_rows')
          .update({
            status: 'processed',
            mapped_data: mapped as unknown,
            created_record_type: 'person',
            created_record_id: ins.id,
            error_message: null,
          })
          .eq('id', row.id)
      } else {
        const name = parseScalarCell(mapped.name)
        if (!name) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message: 'Opportunity name is required',
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        const typeVal = parseScalarCell(mapped.type) ?? 'startup_need'

        const insertPayload = {
          name,
          type: typeVal,
          description: parseScalarCell(mapped.description),
          organization: parseScalarCell(mapped.organization),
          sector: (mapped.sector as string[] | null) ?? null,
          stage: parseScalarCell(mapped.stage),
          need_types: (mapped.need_types as string[] | null) ?? null,
          status: 'active' as const,
          source: CSV_IMPORT_SOURCE,
        }

        const embeddingText = buildOppEmbeddingText(mapped)
        const textForEmbed = embeddingText.length > 0 ? embeddingText : name

        const emb = await embedText(textForEmbed)
        if (!emb.ok) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message: `Embedding failed: ${emb.error}`,
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        const { data: ins, error: insErr } = await supabase
          .from('opportunities')
          .insert({
            ...insertPayload,
            embedding_text: textForEmbed.slice(0, 8000),
            embedding: toPgVectorLiteral(emb.vector),
          })
          .select('id')
          .single()

        if (insErr || !ins) {
          error_count++
          await supabase
            .from('csv_import_rows')
            .update({
              status: 'error',
              error_message: insErr?.message ?? 'Insert failed',
              mapped_data: mapped as unknown,
            })
            .eq('id', row.id)
          continue
        }

        created_count++
        await supabase
          .from('csv_import_rows')
          .update({
            status: 'processed',
            mapped_data: mapped as unknown,
            created_record_type: 'opportunity',
            created_record_id: ins.id,
            error_message: null,
          })
          .eq('id', row.id)
      }
    }

    await supabase
      .from('csv_imports')
      .update({
        status: 'completed',
        error_count,
        column_mapping: approved_mapping as unknown,
        detected_import_type,
        row_count: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', csvImportId)

    edgeLog(FN, 'processing_done', {
      import_id: csvImportId,
      created_count,
      error_count,
    })

    return jsonResponse({
      created_count,
      error_count,
      row_count: total,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    edgeErrorObj(FN, 'unhandled', { error: msg })
    if (importIdMarkFailed) {
      try {
        const sb = createServiceClient()
        await sb
          .from('csv_imports')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', importIdMarkFailed)
      } catch {
        /* ignore */
      }
    }
    return jsonResponse({ error: msg }, 500)
  }
})
