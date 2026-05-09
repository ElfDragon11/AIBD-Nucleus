/**
 * One-line JSON logs for `supabase functions logs` filtering.
 * Avoid logging secrets; use previews for human text fields.
 */

const PREVIEW_CHARS = 120

export function previewText(text: string | null | undefined): string | undefined {
  if (text == null || text === '') return undefined
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= PREVIEW_CHARS) return t
  return `${t.slice(0, PREVIEW_CHARS)}…`
}

export function edgeLog(
  fn: string,
  msg: string,
  data?: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), lvl: 'info', fn, msg, ...(data ?? {}) }),
  )
}

export function edgeWarn(
  fn: string,
  msg: string,
  data?: Record<string, unknown>,
): void {
  console.warn(
    JSON.stringify({ ts: new Date().toISOString(), lvl: 'warn', fn, msg, ...(data ?? {}) }),
  )
}

export function edgeErrorObj(
  fn: string,
  msg: string,
  err: unknown,
  data?: Record<string, unknown>,
): void {
  const detail =
    err instanceof Error ? { name: err.name, message: err.message } : { detail: String(err) }
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      lvl: 'error',
      fn,
      msg,
      err: detail,
      ...(data ?? {}),
    }),
  )
}
