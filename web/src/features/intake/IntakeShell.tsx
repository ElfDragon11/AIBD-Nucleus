import * as React from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'

import { Link, useNavigate } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'

import { IntentStep } from '@/features/intake/IntentStep'
import {
  classifyLeadEdge,
  processIntakeAnswerEdge,
} from '@/features/intake/intakeEdgeApi'
import {
  getTrailingAssistantQuestion,
  sortMessagesByCreatedAt,
} from '@/features/intake/messageUtils'
import { QuestionCard } from '@/features/intake/QuestionCard'
import { ProgressIndicator } from '@/features/intake/ProgressIndicator'
import type { PublicIntakeSession } from '@/features/intake/publicSession'
import {
  appendIntakeMessage,
  fetchLeadForSession,
  listIntakeMessages,
  updatePublicLead,
} from '@/features/intake/publicLeadApi'

import { pkLead, pkMsgs } from '@/features/intake/queryKeys'

type Props = {
  leadId: string
  session: PublicIntakeSession
}

export function IntakeShell({ leadId, session }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const leadQuery = useQuery({
    queryKey: pkLead(leadId, session.publicSessionId),
    queryFn: () => fetchLeadForSession(leadId, session.publicSessionId),
  })

  const messagesQuery = useQuery({
    queryKey: pkMsgs(leadId, session.publicSessionId),
    queryFn: () => listIntakeMessages(leadId, session.publicSessionId),
    enabled: leadQuery.isSuccess && leadQuery.data != null,
  })

  async function invalidateSession() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: pkLead(leadId, session.publicSessionId),
      }),
      queryClient.invalidateQueries({
        queryKey: pkMsgs(leadId, session.publicSessionId),
      }),
    ])
  }

  const intentMutation = useMutation({
    mutationFn: async (intentText: string) => {
      await updatePublicLead({
        leadId,
        publicSessionId: session.publicSessionId,
        rawIntent: intentText,
      })

      await appendIntakeMessage({
        leadId,
        publicSessionId: session.publicSessionId,
        sender: 'user',
        message: intentText,
        metadata: { kind: 'intent' },
      })

      await classifyLeadEdge({
        lead_id: leadId,
        public_session_id: session.publicSessionId,
        raw_intent: intentText,
      })
    },
    onSuccess: async () => {
      await invalidateSession()
    },
  })

  const answerMutation = useMutation({
    mutationFn: async (vars: {
      questionText: string
      combinedAnswer: string
    }) => {
      const result = await processIntakeAnswerEdge({
        lead_id: leadId,
        public_session_id: session.publicSessionId,
        question: vars.questionText,
        answer: vars.combinedAnswer,
      })
      return result
    },
    onSuccess: async (data) => {
      if (data.should_show_recommendations) {
        navigate(`/recommendations/${leadId}`)
      }
      await invalidateSession()
    },
  })

  React.useEffect(() => {
    const lead = leadQuery.data
    if (
      lead &&
      (lead.status === 'intake_complete' ||
        lead.status === 'recommendations_shown')
    ) {
      navigate(`/recommendations/${leadId}`, { replace: true })
    }
  }, [leadQuery.data?.status, leadId, navigate, leadQuery.data])

  const maybeLead = leadQuery.data

  const sortedMsgs = React.useMemo(
    () => sortMessagesByCreatedAt(messagesQuery.data ?? []),
    [messagesQuery.data],
  )

  const lastMsg = sortedMsgs[sortedMsgs.length - 1]
  const trailingQuestion = getTrailingAssistantQuestion(sortedMsgs)

  const progressPhase =
    maybeLead && !maybeLead.raw_intent?.trim()
      ? 3
      : maybeLead?.raw_intent && trailingQuestion
        ? 4
        : 4

  if (leadQuery.isPending) {
    return <IntakeLoadingShell />
  }

  const leadLoaded = maybeLead ?? null

  if (!leadLoaded) {
    return (
      <IntakeFatal
        hint="Resume links only work on the same browser. Clear and start fresh if needed."
      />
    )
  }

  const awaitingNextQuestion =
    !!leadLoaded.raw_intent?.trim() &&
    lastMsg?.sender === 'user' &&
    !answerMutation.isPending &&
    !intentMutation.isPending &&
    !trailingQuestion

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border/80 bg-card/90">
        <div className="mx-auto flex max-w-3xl px-4 py-6 sm:px-6">
          <Link
            to="/"
            className="font-serif text-lg tracking-tight text-foreground underline-offset-4 hover:underline"
          >
            Nucleus Concierge
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-8">
          <ProgressIndicator current={progressPhase} />

          {!leadLoaded.raw_intent?.trim() ? (
            <IntentStep
              submitting={intentMutation.isPending}
              onSubmit={(v) => intentMutation.mutate(v.raw_intent)}
            />
          ) : intentMutation.isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Reading what you shared…
            </div>
          ) : trailingQuestion ? (
            <QuestionCard
              key={trailingQuestion.id}
              question={trailingQuestion}
              submitting={answerMutation.isPending}
              onContinue={(body) => {
                answerMutation.mutate({
                  questionText: trailingQuestion.question,
                  combinedAnswer: body,
                })
              }}
            />
          ) : awaitingNextQuestion ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Updating your concierge session…
            </div>
          ) : answerMutation.isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Saving your answer…
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Preparing the next question…
            </div>
          )}

          {intentMutation.isError || answerMutation.isError ? (
            <p className="text-sm text-destructive">
              Something went wrong. Check your connection and try again. If new
              intakes repeatedly fail, confirm AI Edge Functions deploy and{' '}
              <code className="font-mono text-xs">OPENAI_API_KEY</code> is set
              in Supabase secrets.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function IntakeLoadingShell() {
  return (
    <div className="min-h-svh bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <Skeleton className="h-40 w-full max-w-xl" />
      </div>
    </div>
  )
}

function IntakeFatal({ hint }: { hint: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-2xl">We could not restore this session</h1>
      <p className="max-w-md text-muted-foreground">{hint}</p>
      <Link
        className="text-sm font-medium text-foreground underline underline-offset-4"
        to="/intake?fresh=1"
      >
        Start a fresh intake
      </Link>
    </div>
  )
}
