import { zodResolver } from '@hookform/resolvers/zod'
import type { JSX } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import type { IntentFormValues } from '@/features/intake/schemas'
import { intentSchema } from '@/features/intake/schemas'

type Props = {
  submitting: boolean
  onSubmit: (v: IntentFormValues) => void
}

export function IntentStep({ submitting, onSubmit }: Props): JSX.Element {
  const form = useForm<IntentFormValues>({
    resolver: zodResolver(intentSchema),
    defaultValues: { raw_intent: '' },
  })

  const placeholderExamples =
    'Example: I am a professor with a promising invention and I need help figuring out whether it could become a company.'

  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-col gap-5"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="text-left">
        <h2
          id="intent-heading"
          className="font-serif text-2xl tracking-tight sm:text-3xl"
        >
          What brings you to Nucleus?
        </h2>
      </div>

      <div className="grid gap-1.5 text-left">
        <Textarea
          id="raw_intent"
          rows={6}
          placeholder={placeholderExamples}
          aria-labelledby="intent-heading"
          {...form.register('raw_intent')}
          aria-invalid={!!form.formState.errors.raw_intent || undefined}
        />
        {form.formState.errors.raw_intent ? (
          <p className="text-xs text-destructive">{form.formState.errors.raw_intent.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? 'Reading your note…' : 'Continue'}
      </Button>
    </form>
  )
}
