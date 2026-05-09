import { z } from 'npm:zod@3.23.8'

export const nextQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).max(8),
  allow_free_response: z.boolean(),
  allow_unsure: z.boolean(),
  field_target: z.string().min(1),
})

export type NextQuestion = z.infer<typeof nextQuestionSchema>

/** Matches OpenAI JSON mode where fields are often omitted (undefined ≠ null). */
export const classifyLlmSchema = z.object({
  primary_type: z
    .any()
    .optional()
    .transform((v): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === null) return null
      const s = typeof v === 'string' ? v.trim() : String(v).trim()
      return s.length > 0 ? s : null
    }),
  secondary_types: z
    .any()
    .optional()
    .transform((raw): string[] | undefined => {
      if (raw === undefined) return undefined
      if (raw === null) return []
      if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : []
      if (Array.isArray(raw)) {
        return raw.flatMap((x) => {
          if (typeof x === 'string' && x.trim()) return [x.trim()]
          if (typeof x === 'number' || typeof x === 'boolean') {
            const s = String(x).trim()
            return s ? [s] : []
          }
          return []
        })
      }
      return []
    }),
  confidence: z
    .any()
    .optional()
    .transform((val): number | null => {
      if (val === null || val === undefined || val === '') return null
      if (typeof val === 'number')
        return Number.isFinite(val) ? Math.min(1, Math.max(0, val)) : null
      if (typeof val === 'string') {
        const n = parseFloat(val)
        return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null
      }
      return null
    }),
  sector_guess: z
    .any()
    .optional()
    .transform((v): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === null || v === '') return null
      const s = typeof v === 'string' ? v.trim() : String(v).trim()
      return s.length > 0 ? s : null
    }),
  stage_guess: z
    .any()
    .optional()
    .transform((v): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === null || v === '') return null
      const s = typeof v === 'string' ? v.trim() : String(v).trim()
      return s.length > 0 ? s : null
    }),
  intent_guess: z
    .any()
    .optional()
    .transform((v): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === null || v === '') return null
      const s = typeof v === 'string' ? v.trim() : String(v).trim()
      return s.length > 0 ? s : null
    }),
  suggested_tags: z
    .any()
    .optional()
    .transform((raw): string[] | undefined => {
      if (raw === undefined) return undefined
      if (raw === null) return []
      if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : []
      if (Array.isArray(raw)) {
        return raw
          .map((x) =>
            typeof x === 'string' ? x.trim() : String(x).trim(),
          )
          .filter(Boolean)
      }
      return []
    }),
  first_followup_question: z
    .any()
    .optional()
    .transform((raw):
      | {
        question?: string
        options: string[]
        allow_free_response?: boolean
        allow_unsure?: boolean
        field_target?: string
      }
      | undefined => {
      if (raw === undefined || raw === null || raw === '') return undefined
      if (typeof raw !== 'object' || Array.isArray(raw)) return undefined
      const o = raw as Record<string, unknown>

      const qRaw = o.question
      const question =
        qRaw === undefined || qRaw === null
          ? ''
          : typeof qRaw === 'string'
            ? qRaw.trim()
            : String(qRaw).trim()

      const ftRaw = o.field_target
      const field_target =
        ftRaw === undefined || ftRaw === null
          ? undefined
          : String(ftRaw).trim() || undefined

      let opts = o.options
      if (!Array.isArray(opts)) opts = []

      const options = opts.map((item) =>
        typeof item === 'string' ? item.trim() : String(item).trim(),
      ).filter((s) => s.length > 0)

      const coerceBool = (v: unknown): boolean | undefined => {
        if (typeof v === 'boolean') return v
        if (v === 'true' || v === 'yes' || v === '1') return true
        if (v === 'false' || v === 'no' || v === '0') return false
        return undefined
      }

      return {
        ...(question.length > 0 ? { question } : {}),
        options,
        allow_free_response: coerceBool(o.allow_free_response),
        allow_unsure: coerceBool(o.allow_unsure),
        ...(field_target ? { field_target } : {}),
      }
    }),
})

export type ClassifyLlmOut = z.infer<typeof classifyLlmSchema>

export const processIntakeLlmSchema = z.object({
  profile_fields: z.record(z.unknown()).nullable().optional(),
  confidence_by_field: z.record(z.number()).nullable().optional(),
  profile_summary: z.string().nullable().optional(),
  missing_fields: z.array(z.string()).nullable().optional(),
  should_show_recommendations: z.boolean().optional(),
  next_question: z
    .object({
      question: z.string(),
      options: z.array(z.string()),
      allow_free_response: z.boolean().optional(),
      allow_unsure: z.boolean().optional(),
      field_target: z.string().optional(),
    })
    .nullable()
    .optional(),
  bad_fit_risk: z.enum(['low', 'medium', 'high']).nullable().optional(),
})

export type ProcessIntakeLlmOut = z.infer<typeof processIntakeLlmSchema>

/** find-matches: rerank + explain among provided candidate ids only */
const confidenceLabelSchema = z.enum([
  'High',
  'Medium-high',
  'Medium',
  'Exploratory',
])

const matchExplainItemSchema = z.object({
  kind: z.enum(['person', 'opportunity']),
  id: z.string().uuid(),
  why_this_fits: z.string().min(1),
  best_next_step: z.string().min(1),
  potential_gap: z.string().nullable().optional(),
  confidence_label: confidenceLabelSchema,
})

export const findMatchesLlmSchema = z.object({
  final_matches: z.array(matchExplainItemSchema).max(4),
})

export type FindMatchesLlmOut = z.infer<typeof findMatchesLlmSchema>

/** map-csv-columns: AI maps CSV headers → target field keys or "ignore". */
export const mapCsvColumnsLlmSchema = z.object({
  detected_import_type: z.enum(['people', 'opportunities']),
  column_mapping: z
    .record(z.unknown())
    .transform((rec): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const [header, v] of Object.entries(rec)) {
        const h = header.trim()
        if (!h) continue
        const val =
          v === null || v === undefined
            ? 'ignore'
            : typeof v === 'string'
              ? v.trim() || 'ignore'
              : String(v).trim() || 'ignore'
        out[h] = val
      }
      return out
    }),
  confidence: z
    .any()
    .optional()
    .transform((val): number | null => {
      if (val === null || val === undefined || val === '') return null
      if (typeof val === 'number') {
        return Number.isFinite(val) ? Math.min(1, Math.max(0, val)) : null
      }
      if (typeof val === 'string') {
        const n = parseFloat(val)
        return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null
      }
      return null
    }),
  requires_review: z
    .any()
    .optional()
    .transform((raw): string[] => {
      if (raw === undefined || raw === null) return []
      if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : []
      if (!Array.isArray(raw)) return []
      return raw
        .map((x) => (typeof x === 'string' ? x.trim() : String(x).trim()))
        .filter(Boolean)
    }),
})

export type MapCsvColumnsLlmOut = z.infer<typeof mapCsvColumnsLlmSchema>
