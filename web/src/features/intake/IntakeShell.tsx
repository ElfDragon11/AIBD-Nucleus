import * as React from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'

import { Link, useNavigate } from 'react-router-dom'

import { PublicSiteHeader } from '@/components/brand/PublicSiteHeader'
import { Skeleton } from '@/components/ui/skeleton'

import { IntakeStepFrame } from '@/features/intake/IntakeStepFrame'
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
import { runWithViewTransition } from '@/lib/viewTransition'

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
      fieldTarget?: string
    }) => {
      const result = await processIntakeAnswerEdge({
        lead_id: leadId,
        public_session_id: session.publicSessionId,
        question: vars.questionText,
        answer: vars.combinedAnswer,
        ...(vars.fieldTarget != null && vars.fieldTarget !== ''
          ? { field_target: vars.fieldTarget }
          : {}),
      })
      return result
    },
    onSuccess: async (data) => {
      if (data.should_show_recommendations) {
        runWithViewTransition(() => {
          navigate(`/recommendations/${leadId}`)
        })
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
      runWithViewTransition(() => {
        navigate(`/recommendations/${leadId}`, { replace: true })
      })
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

  const leadLoaded = maybeLead ?? null

  const awaitingNextQuestion =
    !!leadLoaded?.raw_intent?.trim() &&
    lastMsg?.sender === 'user' &&
    !answerMutation.isPending &&
    !intentMutation.isPending &&
    !trailingQuestion

  const intakeStepKey = React.useMemo(() => {
    if (leadQuery.isPending) return 'loading'
    if (!leadLoaded) return 'unavailable'
    if (!leadLoaded.raw_intent?.trim()) {
      return intentMutation.isPending ? 'intent-sending' : 'intent-open'
    }
    if (intentMutation.isPending) return 'intent-classifying'
    if (trailingQuestion) return `question-${trailingQuestion.id}`
    if (awaitingNextQuestion) return 'assistant-typing'
    if (answerMutation.isPending) return 'answer-saving'
    return 'question-loading'
  }, [
    answerMutation.isPending,
    awaitingNextQuestion,
    intentMutation.isPending,
    leadLoaded,
    leadQuery.isPending,
    trailingQuestion?.id,
  ])

  if (leadQuery.isPending) {
    return <IntakeLoadingShell />
  }

  if (!leadLoaded) {
    return (
      <IntakeFatal
        hint="Resume links only work on the same browser. Clear and start fresh if needed."
      />
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <PublicSiteHeader />

      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <div className="space-y-8 bg-background p-6 sm:p-8">
          <ProgressIndicator current={progressPhase} />

          <div className="min-h-[min(70vh,28rem)]">
            <IntakeStepFrame key={intakeStepKey} className="w-full">
              {!leadLoaded.raw_intent?.trim() ? (
                <IntentStep
                  submitting={intentMutation.isPending}
                  onSubmit={(v) => intentMutation.mutate(v.raw_intent)}
                />
              ) : intentMutation.isPending ? (
                <div className="flex w-full flex-col gap-8">
                  <SubmittedGoalPanel text={leadLoaded.raw_intent.trim()} />
                  <ThinkingIndicator
                    title="Reading what you shared…"
                    description="We’re reviewing your goal and lining up smart follow-ups. This usually takes a few seconds."
                  />
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
                      fieldTarget: trailingQuestion.fieldTarget,
                    })
                  }}
                />
              ) : awaitingNextQuestion ? (
                <div className="flex w-full flex-col gap-8">
                  <SubmittedGoalPanel text={leadLoaded.raw_intent.trim()} />
                  <ThinkingIndicator
                    title="Thinking for a moment…"
                    description="We’re using what you shared to shape the next question."
                  />
                </div>
              ) : answerMutation.isPending ? (
                <div className="flex w-full flex-col gap-8">
                  <SubmittedGoalPanel text={leadLoaded.raw_intent.trim()} />
                  <ThinkingIndicator
                    title="Saving your answer…"
                    description="Hang tight — we’re updating your intake."
                  />
                </div>
              ) : (
                <div className="flex w-full flex-col gap-8">
                  <SubmittedGoalPanel text={leadLoaded.raw_intent.trim()} />
                  <ThinkingIndicator
                    title="Preparing the next question…"
                    description="Almost there — deciding what to ask next based on your goal."
                  />
                </div>
              )}
            </IntakeStepFrame>
          </div>

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

function SubmittedGoalPanel({ text }: { text: string }) {
  return (
    <div className="w-full text-left">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--nucleus-blue)]">
        Your goal
      </p>
      <h2 className="mb-4 font-serif text-2xl font-medium tracking-tight sm:text-3xl">
        What brings you to Nucleus?
      </h2>
      <blockquote className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground sm:text-base">
        {text}
      </blockquote>
    </div>
  )
}

function ThinkingIndicator({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      className="flex w-full min-h-[10rem] flex-col justify-center gap-4 rounded-lg border border-dashed border-border/90 bg-muted/25 px-4 py-5 sm:min-h-[9rem] sm:flex-row sm:items-center sm:gap-5"
      role="status"
      aria-live="polite"
    >
      <Loader2Icon
        className="size-8 shrink-0 animate-spin text-[var(--nucleus-blue)]"
        aria-hidden
      />
      <div className="min-w-0 space-y-1.5 text-left">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm leading-snug text-muted-foreground">{description}</p>
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
