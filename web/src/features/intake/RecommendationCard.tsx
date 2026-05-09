import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import type { MockRecommendation } from '@/features/intake/mockRecommendations'

function KindBadge({
  iconKind,
}: Pick<MockRecommendation, 'iconKind'>) {
  const label =
    iconKind === 'operator'
      ? 'Operator pathway'
      : iconKind === 'program'
        ? 'Program cohort'
        : 'Human-led intro'

  return (
    <span className="rounded-md border border-foreground/10 bg-muted/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  )
}

type Props = {
  item: MockRecommendation
}

export function RecommendationCard({ item }: Props) {
  return (
    <Card size="sm" className="border-border/80 bg-card/90">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle>{item.title}</CardTitle>
          <KindBadge iconKind={item.iconKind} />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {item.matchKind}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-3 text-[0.95rem] leading-relaxed">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Why this fits
          </span>
          <p>{item.whyThisFits}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Best next step
          </span>
          <p>{item.bestNextStep}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 rounded-b-xl">
        <p className="text-sm font-medium">
          Confidence:&nbsp;<span className="text-foreground">{item.confidenceLabel}</span>
        </p>
        {item.potentialGap ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide">
              Potential gap
            </span>
            <p>{item.potentialGap}</p>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  )
}
