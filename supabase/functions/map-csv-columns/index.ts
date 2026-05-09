import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { verifyAdminFromRequest } from '../_shared/admin_auth.ts'
import {
  allowedTargetsForType,
  buildTargetSchemaForLlm,
  IGNORE_COLUMN,
  type ImportRecordType,
} from '../_shared/csv_target_schema.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { edgeErrorObj, edgeLog, edgeWarn } from '../_shared/edge_logger.ts'
import { callOpenAiJson } from '../_shared/llm.ts'
import {
  buildMapCsvSystemPrompt,
  buildMapCsvUserPayload,
} from '../_shared/prompts.ts'
import { mapCsvColumnsLlmSchema } from '../_shared/schemas.ts'

const FN = 'map-csv-columns'

function sanitizeMapping(
  headers: string[],
  importType: ImportRecordType,
  raw: Record<string, string>,
): Record<string, string> {
  const allowed = allowedTargetsForType(importType)
  const out: Record<string, string> = {}
  for (const h of headers) {
    const key = h.trim()
    if (!key) continue
    const mapped = raw[key] ?? raw[h] ?? IGNORE_COLUMN
    const v = String(mapped).trim() || IGNORE_COLUMN
    out[key] = allowed.has(v) ? v : IGNORE_COLUMN
  }
  return out
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

  try {
    const body = (await req.json()) as {
      headers?: unknown
      sample_rows?: unknown
    }

    const headersRaw = body.headers
    if (!Array.isArray(headersRaw) || headersRaw.length === 0) {
      return jsonResponse({ error: 'headers must be a non-empty array' }, 400)
    }
    const headers = headersRaw.map((h) => String(h).trim()).filter(Boolean)
    if (!headers.length) {
      return jsonResponse({ error: 'no valid headers' }, 400)
    }

    const sample = Array.isArray(body.sample_rows) ? body.sample_rows : []
    const sample_rows: Record<string, unknown>[] = sample
      .slice(0, 12)
      .map((row) => {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          return row as Record<string, unknown>
        }
        return {}
      })

    edgeLog(FN, 'request', {
      admin: auth.adminUserId,
      header_count: headers.length,
      sample_n: sample_rows.length,
    })

    const schemaJson = JSON.stringify(buildTargetSchemaForLlm(), null, 0)
    const llm = await callOpenAiJson<Record<string, unknown>>([
      {
        role: 'system',
        content: buildMapCsvSystemPrompt(schemaJson),
      },
      {
        role: 'user',
        content: buildMapCsvUserPayload({ headers, sample_rows }),
      },
    ])

    if (!llm.ok) {
      edgeErrorObj(FN, 'llm_failed', { error: llm.error })
      return jsonResponse({ error: llm.error }, 502)
    }

    const parsed = mapCsvColumnsLlmSchema.safeParse(llm.data)
    if (!parsed.success) {
      edgeWarn(FN, 'llm_schema_mismatch', { issues: parsed.error.issues })
      return jsonResponse(
        { error: 'Invalid model output', details: parsed.error.flatten() },
        502,
      )
    }

    const {
      detected_import_type,
      column_mapping: llmMapping,
      confidence,
      requires_review,
    } = parsed.data

    const column_mapping = sanitizeMapping(
      headers,
      detected_import_type,
      llmMapping,
    )

    return jsonResponse({
      detected_import_type,
      column_mapping,
      confidence,
      requires_review,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    edgeErrorObj(FN, 'unhandled', { error: msg })
    return jsonResponse({ error: msg }, 500)
  }
})
