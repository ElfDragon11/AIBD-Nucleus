const STORAGE_KEY = 'nucleus_concierge_public_session'

export type PublicIntakeSession = {
  leadId: string
  publicSessionId: string
}

export function getStoredIntakeSession(): PublicIntakeSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw?.trim()) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'leadId' in parsed &&
      'publicSessionId' in parsed
    ) {
      const leadId = (parsed as { leadId?: unknown }).leadId
      const publicSessionId = (parsed as { publicSessionId?: unknown })
        .publicSessionId
      if (
        typeof leadId === 'string' &&
        leadId.length > 0 &&
        typeof publicSessionId === 'string' &&
        publicSessionId.length > 0
      ) {
        return { leadId, publicSessionId }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveIntakeSession(session: PublicIntakeSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearIntakeSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
