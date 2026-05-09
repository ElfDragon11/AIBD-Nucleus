import type { Json } from '@/lib/database.types'

import type { IntakeQuestion } from '@/features/intake/intakeQuestion'
import type { IntakeMessageRow } from '@/features/intake/publicLeadApi'

export function countAnsweredQuestions(messages: IntakeMessageRow[]): number {
  const userTurns = messages.filter((m) => m.sender === 'user').length
  return Math.max(0, userTurns - 1)
}

export function sortMessagesByCreatedAt(
  messages: IntakeMessageRow[],
): IntakeMessageRow[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

function metaRecord(meta: Json | null): Record<string, unknown> | null {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return meta as Record<string, unknown>
  }
  return null
}

export function parseQuestionFromMessage(
  row: IntakeMessageRow,
): IntakeQuestion | null {
  if (row.sender !== 'assistant') return null
  const meta = metaRecord(row.metadata)
  const kind = meta?.kind
  if (kind !== 'ai_question' && kind !== 'mock_question') return null

  const optionsRaw = meta?.options
  const options = Array.isArray(optionsRaw)
    ? optionsRaw.filter((o): o is string => typeof o === 'string')
    : []

  const idRaw = meta?.question_id ?? meta?.field_target ?? meta?.questionId
  const id =
    typeof idRaw === 'string' && idRaw.trim().length > 0
      ? idRaw.trim()
      : `q_${row.created_at}`

  const ft = meta?.field_target ?? meta?.fieldTarget
  const fieldTarget =
    typeof ft === 'string' && ft.trim().length > 0 ? ft.trim() : undefined

  return {
    id,
    question: row.message,
    options,
    fieldTarget,
  }
}

/** Last assistant question that has not yet been followed by another message. */
export function getTrailingAssistantQuestion(
  messages: IntakeMessageRow[],
): IntakeQuestion | null {
  const sorted = sortMessagesByCreatedAt(messages)
  const last = sorted[sorted.length - 1]
  if (!last) return null
  return parseQuestionFromMessage(last)
}

export function formatProfileValue(value: Json | null): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}
