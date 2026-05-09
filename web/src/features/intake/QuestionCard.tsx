import * as React from 'react'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { IntakeQuestion } from '@/features/intake/intakeQuestion'

import { FreeResponseInput } from '@/features/intake/FreeResponseInput'
import { QuickSelectOptions } from '@/features/intake/QuickSelectOptions'

type Props = {
  question: IntakeQuestion
  submitting: boolean
  onContinue: (answer: string) => void
}

export function QuestionCard({
  question,
  submitting,
  onContinue,
}: Props) {
  const [picked, setPicked] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState('')

  function handleContinue() {
    const parts = [picked, notes.trim()].filter(Boolean)
    const body = parts.join(parts.length >= 2 && picked ? '\n\n' : '')
    if (!body) return
    onContinue(body)
    setPicked(null)
    setNotes('')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-balance text-2xl font-serif tracking-tight sm:text-[1.75rem]">
          {question.question}
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose the closest fit.
        </p>
      </div>
      <QuickSelectOptions
        name={`q-${question.id}`}
        options={question.options}
        selected={picked}
        onSelect={(v) => setPicked(v)}
        disabled={submitting}
      />
      <FreeResponseInput
        id={`free-${question.id}`}
        value={notes}
        onChange={setNotes}
        disabled={submitting}
        placeholder="Optional: nuances, timelines, sensitivities..."
      />
      <Button
        type="button"
        size="lg"
        disabled={submitting || (!picked && notes.trim().length === 0)}
        onClick={handleContinue}
        className="w-full max-w-xl"
      >
        {submitting ? (
          <>
            <Loader2Icon aria-hidden className="size-4 animate-spin" />{' '}
            Saving your answer...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  )
}
