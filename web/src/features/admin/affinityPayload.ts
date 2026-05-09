import { leadDisplayName, matchStatusLabel } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import type { LeadRow } from '@/features/admin/adminTypes'

type Rec = {
  matched_record_type: string
  matched_record_id: string
  why_this_fits: string | null
  best_next_step: string | null
  status: string
  overall_score: number | null
  confidence_label: string | null
}

export type AffinityPreviewEntity =
  | {
      kind: 'person'
      id: string
      name: string
      email: string | null
      organization: string | null
    }
  | {
      kind: 'opportunity'
      id: string
      name: string
      type: string
      organization: string | null
    }

export function buildAffinityPayload(args: {
  lead: LeadRow
  recommendations: Rec[]
  entities: AffinityPreviewEntity[]
  tags: string[]
  suggestedNextAction: string
}) {
  const { lead, recommendations, entities, tags, suggestedNextAction } = args
  return {
    person_name: leadDisplayName(lead),
    email: lead.email,
    organization: lead.organization,
    lead_type: primaryTypeDisplay(lead.primary_type),
    tags,
    ai_summary: lead.ai_summary,
    review_status: lead.review_status,
    recommendations: recommendations.map((r) => {
      const ent = entities.find((e) => e.id === r.matched_record_id)
      const label =
        ent?.kind === 'person'
          ? ent.name
          : ent?.kind === 'opportunity'
            ? ent.name
            : r.matched_record_id
      return {
        type: r.matched_record_type,
        name: label,
        why_this_fits: r.why_this_fits,
        best_next_step: r.best_next_step,
        match_status: matchStatusLabel(r.status),
        score: r.overall_score,
        confidence: r.confidence_label,
      }
    }),
    suggested_next_action: suggestedNextAction,
  }
}
