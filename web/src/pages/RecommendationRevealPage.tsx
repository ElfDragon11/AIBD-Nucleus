import * as React from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { RecommendationReveal } from '@/features/intake/RecommendationReveal'
import { inferMockPrimaryType } from '@/features/intake/mockClassify'
import { getMockRecommendationCards } from '@/features/intake/mockRecommendations'
import { pkLead, pkMsgs } from '@/features/intake/queryKeys'
import {
  fetchLeadForSession,
  listIntakeMessages,
  updatePublicLead,
} from '@/features/intake/publicLeadApi'
import { getStoredIntakeSession } from '@/features/intake/publicSession'

export function RecommendationRevealPage() {
  const { leadId } = useParams()
  const qc = useQueryClient()
  const session = getStoredIntakeSession()
  const routingOk =
    !!leadId && !!session && session.leadId === leadId

  const sid = routingOk ? session!.publicSessionId : ''
  const id = routingOk ? leadId! : ''

  const leadQuery = useQuery({
    queryKey: pkLead(id, sid),
    queryFn: () => fetchLeadForSession(id, sid),
    enabled: routingOk,
  })

  const messagesQuery = useQuery({
    queryKey: pkMsgs(id, sid),
    queryFn: () => listIntakeMessages(id, sid),
    enabled: routingOk && !!leadQuery.data,
  })

  React.useEffect(() => {
    if (
      !routingOk ||
      !leadQuery.data ||
      !messagesQuery.isSuccess ||
      messagesQuery.data == null
    ) {
      return
    }

    const leadRow = leadQuery.data

    if (leadRow.status !== 'intake_complete') return

    void updatePublicLead({
      leadId: id,
      publicSessionId: sid,
      status: 'recommendations_shown',
    }).finally(() =>
      Promise.all([
        qc.invalidateQueries({ queryKey: pkLead(id, sid) }),
        qc.invalidateQueries({ queryKey: pkMsgs(id, sid) }),
      ]).catch(() => undefined),
    )
  }, [
    routingOk,
    id,
    sid,
    qc,
    leadQuery.data,
    messagesQuery.data,
    messagesQuery.isSuccess,
  ])

  if (!routingOk) {
    return <Navigate replace to="/intake?fresh=1" />
  }

  if (leadQuery.isPending || messagesQuery.isPending) {
    return (
      <div className="min-h-svh bg-background px-6 py-12">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <Skeleton className="h-36 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="min-h-[220px] w-full" />
            <Skeleton className="min-h-[220px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  const lead = leadQuery.data ?? null

  if (lead == null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-xl">We could not load this lead.</p>
        <Link className="text-sm underline" to="/">
          Go home
        </Link>
      </div>
    )
  }

  const intakeFlowComplete =
    lead.status === 'intake_complete' ||
    lead.status === 'recommendations_shown'

  if (!intakeFlowComplete) {
    return <Navigate replace to={`/intake/${leadId}`} />
  }

  const primary =
    lead.primary_type ?? inferMockPrimaryType(lead.raw_intent ?? '')

  const cards = getMockRecommendationCards(primary)

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border/80 bg-card/90 px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-4xl justify-between gap-6">
          <Link
            to="/"
            className="font-serif text-lg underline-offset-4 hover:underline"
          >
            Home
          </Link>
          <Link
            className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
            to="/intake?fresh=1"
          >
            Start another intake
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
        <RecommendationReveal lead={lead} items={cards} />
      </div>
    </div>
  )
}
