import { zodResolver } from '@hookform/resolvers/zod'
import type { JSX } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { IdentityFormValues } from '@/features/intake/schemas'
import { identitySchema } from '@/features/intake/schemas'

type Props = {
  submitting: boolean
  onSubmit: (v: IdentityFormValues) => void
}

export function IdentityStep({ submitting, onSubmit }: Props): JSX.Element {
  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
    },
  })

  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="text-left">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--nucleus-blue)]">
          Start intake
        </p>
        <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
          Tell us who you are
        </h2>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} aria-invalid={!!form.formState.errors.first_name || undefined} />
          {form.formState.errors.first_name ? (
            <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} aria-invalid={!!form.formState.errors.last_name || undefined} />
          {form.formState.errors.last_name ? (
            <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
          aria-invalid={!!form.formState.errors.email || undefined}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? 'Starting…' : 'Continue'}
      </Button>
    </form>
  )
}
