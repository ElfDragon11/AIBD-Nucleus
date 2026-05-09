import type { LeadRow, MatchRow } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'

type PersonLite = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  organization: string | null
}

type OppLite = {
  id: string
  name: string
  type: string
  organization: string | null
}

export function buildIntroDraftFromContext(args: {
  lead: LeadRow
  matches: MatchRow[]
  peopleById: Map<string, PersonLite>
  opportunitiesById: Map<string, OppLite>
}): string {
  const { lead, matches, peopleById, opportunitiesById } = args
  const recipient = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'there'
  const primary = primaryTypeDisplay(lead.primary_type)
  const lines: string[] = []
  lines.push(`Hi ${recipient},`)
  lines.push('')
  lines.push(
    `We reviewed your note to Nucleus and wanted to suggest a few introductions that may help${
      primary ? ` given your background as ${primary}` : ''
    }.`,
  )
  if (lead.ai_summary) {
    lines.push('')
    lines.push(`Our summary: ${lead.ai_summary}`)
  }
  const top = matches
    .filter((m) => m.status === 'approved' || m.status === 'generated')
    .slice(0, 4)
  if (top.length) {
    lines.push('')
    lines.push('Suggested introductions:')
    for (const m of top) {
      if (m.matched_record_type === 'person') {
        const p = peopleById.get(m.matched_record_id)
        const label = p
          ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.organization
          : 'A matched contact'
        lines.push(
          `- ${label}${p?.organization ? ` (${p.organization})` : ''}${
            m.why_this_fits ? ` — ${m.why_this_fits}` : ''
          }`,
        )
      } else {
        const o = opportunitiesById.get(m.matched_record_id)
        const label = o?.name ?? 'A matched opportunity'
        lines.push(
          `- ${label}${o?.organization ? ` (${o.organization})` : ''}${
            m.why_this_fits ? ` — ${m.why_this_fits}` : ''
          }`,
        )
      }
    }
  }
  lines.push('')
  lines.push(
    'If any of these feel like a fit, reply and we can coordinate a warm introduction.',
  )
  lines.push('')
  lines.push('— Nucleus Connections Hub')
  return lines.join('\n')
}
