import { RecommendationCard } from '@/features/intake/RecommendationCard'

import type { LeadRow } from '@/features/intake/publicLeadApi'

import type { MockRecommendation } from '@/features/intake/mockRecommendations'

type Props = {
  lead: LeadRow
  items: MockRecommendation[]
}

export function RecommendationReveal({ lead, items }: Props) {
  const display = items.slice(0, 4)
  const greetingName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Friend'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Recommendations preview (Phase 3 mock data — matching lands in Phase 5)
        </p>
        <p className="text-sm font-medium text-foreground">{greetingName}</p>
        <h1 className="text-balance font-serif text-[1.95rem] leading-tight tracking-tight sm:text-4xl">
          We have enough to recommend a few strong next steps.
        </h1>
        <p className="text-muted-foreground sm:max-w-2xl">
          These cards mirror the shape admin staff will finalize after AI matching —
          your concierge session stays on file for humans to steward every intro.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2" aria-labelledby="reco-list">
        <h2 id="reco-list" className="sr-only">
          Recommended introductions
        </h2>
        {display.map((rc, idx) => (
          <RecommendationCard key={`${idx}-${rc.title}`} item={rc} />
        ))}
      </section>
    </div>
  )
}
