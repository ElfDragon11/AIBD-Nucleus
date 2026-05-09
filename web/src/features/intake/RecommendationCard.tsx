import { useMutation } from '@tanstack/react-query'
import { CheckIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  deriveIntroRequestKind,
  introRequestButtonLabel,
} from '@/features/intake/introActions'
import type { MatchCardItem } from '@/features/intake/mockRecommendations'
import { createIntroductionRequest } from '@/features/intake/publicLeadApi'

type Props = {
  item: MatchCardItem
  leadId: string
  publicSessionId: string
}

export function RecommendationCard({
  item,
  leadId,
  publicSessionId,
}: Props) {
  const [submitted, setSubmitted] = useState(false)
  const kind = deriveIntroRequestKind(item)
  const label = introRequestButtonLabel(kind)

  const requestMutation = useMutation({
    mutationFn: async () => {
      await createIntroductionRequest({
        leadId,
        publicSessionId,
        requestKind: kind,
        targetTitle: item.title,
        matchRecordId: item.matchRecordId ?? null,
      })
    },
    onSuccess: () => setSubmitted(true),
  })

  return (
    <Card size="sm" className="border-border bg-card">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle>{item.title}</CardTitle>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--nucleus-blue)]">
          {item.matchKind}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-3 text-[0.95rem] leading-relaxed">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Why this fits
          </span>
          <p>{item.whyThisFits}</p>
        </div>
        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Best next step
          </span>
          <p className="text-[0.95rem] leading-relaxed">{item.bestNextStep}</p>
          <div className="flex flex-col items-stretch gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto sm:self-start"
              disabled={submitted || requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending ? (
                'Submitting…'
              ) : submitted ? (
                <>
                  <CheckIcon className="mr-1.5 size-4" aria-hidden />
                  Requested
                </>
              ) : (
                label
              )}
            </Button>
            {submitted ? (
              <p className="text-sm text-muted-foreground">
                We will email you soon.
              </p>
            ) : null}
            {requestMutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                Could not submit right now. Please try again in a moment.
              </p>
            ) : null}
          </div>
        </div>
        {item.potentialGap ? (
          <div className="space-y-1 border-t border-border/60 pt-3 text-sm text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Potential gap
            </span>
            <p className="text-[0.95rem] leading-relaxed">{item.potentialGap}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
