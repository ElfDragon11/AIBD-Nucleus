import type { Database } from '@/lib/database.types'

export type LeadRow = Database['public']['Tables']['leads']['Row']
export type MatchRow = Database['public']['Tables']['match_records']['Row']
export type PersonRow = Database['public']['Tables']['people']['Row']
export type OpportunityRow = Database['public']['Tables']['opportunities']['Row']

export const MATCH_STATUSES = [
  'generated',
  'approved',
  'rejected',
  'hold',
  'intro_drafted',
  'synced',
] as const

export type MatchStatus = (typeof MATCH_STATUSES)[number]

export function leadDisplayName(lead: Pick<LeadRow, 'first_name' | 'last_name' | 'email'>) {
  const n = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim()
  if (n) return n
  if (lead.email) return lead.email
  return 'Unknown lead'
}

export function personDisplayName(p: Pick<PersonRow, 'first_name' | 'last_name' | 'email'>) {
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
  if (n) return n
  if (p.email) return p.email
  return 'Unknown person'
}

export function matchStatusLabel(s: string) {
  switch (s) {
    case 'generated':
      return 'Generated'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'hold':
      return 'Hold'
    case 'intro_drafted':
      return 'Intro drafted'
    case 'synced':
      return 'Synced'
    default:
      return s
  }
}
