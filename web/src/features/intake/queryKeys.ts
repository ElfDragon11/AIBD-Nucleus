/** Shared TanStack Query keys for public intake. */
export function pkLead(id: string, sid: string) {
  return ['publicIntakeLead', id, sid] as const
}

export function pkMsgs(id: string, sid: string) {
  return ['publicIntakeMessages', id, sid] as const
}

export function pkMatch(id: string, sid: string) {
  return ['publicIntakeMatches', id, sid] as const
}