import * as React from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'

import { PublicSiteHeader } from '@/components/brand/PublicSiteHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { FindingMatchesLoader } from '@/features/intake/FindingMatchesLoader'
import { findMatchesEdge } from '@/features/intake/intakeEdgeApi'
import { inferMockPrimaryType } from '@/features/intake/mockClassify'
import { getMockRecommendationCards, matchRpcRowToCard } from '@/features/intake/mockRecommendations'
import { getMockQuestionsForPrimaryType } from '@/features/intake/mockIntakeDriver'
import { countAnsweredQuestions } from '@/features/intake/messageUtils'
import { pkLead, pkMatch, pkMsgs } from '@/features/intake/queryKeys'
import {
  fetchLeadForSession,
  listIntakeMessages,
  listMatchRecordsForSession,
  updatePublicLead,
} from '@/features/intake/publicLeadApi'
import { RecommendationReveal } from '@/features/intake/RecommendationReveal'
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

  const leadRow = leadQuery.data ?? null

  const primary =
    leadRow?.primary_type ?? inferMockPrimaryType(leadRow?.raw_intent ?? '')
  const questionList = getMockQuestionsForPrimaryType(primary)
  const answered = countAnsweredQuestions(messagesQuery.data ?? [])

  const intakeFlowComplete =
    !!leadRow?.raw_intent?.trim() &&
    questionList.length > 0 &&
    answered >= questionList.length

  const recommendationsGate =
    intakeFlowComplete || leadRow?.status === 'recommendations_shown'

  const matchQuery = useQuery({
    queryKey: pkMatch(id, sid),
    queryFn: async () => {
      let rows = await listMatchRecordsForSession(id, sid)
      if (rows.length > 0) return rows

      const leadCheck = await fetchLeadForSession(id, sid)
      if (
        leadCheck?.status !== 'intake_complete' &&
        leadCheck?.status !== 'recommendations_shown'
      ) {
        return rows
      }

      await findMatchesEdge({ lead_id: id, public_session_id: sid, limit: 4 })
      rows = await listMatchRecordsForSession(id, sid)
      return rows
    },
    enabled:
      routingOk &&
      leadQuery.isSuccess &&
      messagesQuery.isSuccess &&
      recommendationsGate,
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

    const lr = leadQuery.data

    const qsLen = getMockQuestionsForPrimaryType(
      lr.primary_type ?? inferMockPrimaryType(lr.raw_intent ?? ''),
    ).length
    const ans = countAnsweredQuestions(messagesQuery.data)
    const flowReady =
      !!lr.raw_intent?.trim() && qsLen > 0 && ans >= qsLen

    if (!flowReady || lr.status !== 'intake_complete') return

    void updatePublicLead({
      leadId: id,
      publicSessionId: sid,
      status: 'recommendations_shown',
    }).finally(() =>
      Promise.all([
        qc.invalidateQueries({ queryKey: pkLead(id, sid) }),
        qc.invalidateQueries({ queryKey: pkMsgs(id, sid) }),
        qc.invalidateQueries({ queryKey: pkMatch(id, sid) }),
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

  const primarySlug =
    lead.primary_type ?? inferMockPrimaryType(lead.raw_intent ?? '')
  const qs = getMockQuestionsForPrimaryType(primarySlug)
  const ansCount = countAnsweredQuestions(messagesQuery.data ?? [])

  const intakeDone =
    !!lead.raw_intent?.trim() &&
    qs.length > 0 &&
    ansCount >= qs.length

  if (!(intakeDone || lead.status === 'recommendations_shown')) {
    return <Navigate replace to={`/intake/${leadId}`} />
  }

  if (matchQuery.isPending) {
    return <FindingMatchesLoader />
  }

  if (matchQuery.isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-xl">We couldn&apos;t load recommendations.</p>
        <Link className="text-sm underline" to={`/intake/${leadId}`}>
          Back to intake
        </Link>
      </div>
    )
  }

  const rpcCards = (matchQuery.data ?? []).map(matchRpcRowToCard)
  const cards =
    rpcCards.length > 0 ? rpcCards : getMockRecommendationCards(primarySlug)

  return (
    <div className="min-h-svh bg-secondary">
      <PublicSiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
        <RecommendationReveal
          lead={lead}
          items={cards}
          leadId={id}
          publicSessionId={sid}
        />
      </div>
    </div>
  )
}
