import { RecommendationCard } from '@/features/intake/RecommendationCard'

import { recommendationHeadlineForPrimaryType } from '@/features/intake/leadLabels'
import { inferMockPrimaryType } from '@/features/intake/mockClassify'
import type { LeadRow } from '@/features/intake/publicLeadApi'

import type { MatchCardItem } from '@/features/intake/mockRecommendations'

type Props = {
  lead: LeadRow
  items: MatchCardItem[]
  leadId: string
  publicSessionId: string
}

export function RecommendationReveal({
  lead,
  items,
  leadId,
  publicSessionId,
}: Props) {
  const display = items.slice(0, 4)
  const greetingName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Friend'
  const primarySlug =
    lead.primary_type ?? inferMockPrimaryType(lead.raw_intent ?? '')
  const headline = recommendationHeadlineForPrimaryType(primarySlug)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 bg-background p-6 sm:p-8">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nucleus-blue)]">
          Curated next connections
        </p>
        <p className="text-sm font-medium text-foreground">{greetingName}</p>
        <h1 className="text-balance font-serif text-[1.95rem] font-medium leading-tight tracking-tight sm:text-4xl">
          {headline}
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2" aria-labelledby="reco-list">
        <h2 id="reco-list" className="sr-only">
          Recommended introductions
        </h2>
        {display.map((rc, idx) => (
          <RecommendationCard
            key={`${idx}-${rc.title}-${rc.matchRecordId ?? 'mock'}`}
            item={rc}
            leadId={leadId}
            publicSessionId={publicSessionId}
          />
        ))}
      </section>
    </div>
  )
}
