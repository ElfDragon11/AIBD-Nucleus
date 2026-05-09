import * as React from 'react'

import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { IdentityStep } from '@/features/intake/IdentityStep'
import { ProgressIndicator } from '@/features/intake/ProgressIndicator'
import { createPublicLead } from '@/features/intake/publicLeadApi'
import {
  clearIntakeSession,
  getStoredIntakeSession,
  saveIntakeSession,
} from '@/features/intake/publicSession'
import type { IdentityFormValues } from '@/features/intake/schemas'

export function IntakeStartPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fresh = params.get('fresh') === '1'
  const storedLeadId = getStoredIntakeSession()?.leadId

  React.useEffect(() => {
    if (!fresh) return
    clearIntakeSession()
    navigate({ pathname: '/intake', search: '' }, { replace: true })
  }, [fresh, navigate])

  React.useEffect(() => {
    if (fresh) return
    if (!storedLeadId) return
    navigate(`/intake/${storedLeadId}`, { replace: true })
  }, [fresh, navigate, storedLeadId])

  const createMutation = useMutation({
    mutationFn: async (vals: IdentityFormValues) => {
      const sessionId = globalThis.crypto.randomUUID()
      const id = await createPublicLead({
        firstName: vals.first_name.trim(),
        lastName: vals.last_name.trim(),
        email: vals.email.trim(),
        publicSessionId: sessionId,
      })
      saveIntakeSession({
        leadId: id,
        publicSessionId: sessionId,
      })
      return id
    },
    onSuccess: (id) => {
      navigate(`/intake/${id}`)
    },
  })

  if (!fresh && storedLeadId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6">
        <p className="text-sm text-muted-foreground">
          Continuing your intake on this browser…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border/80 bg-card/90 px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl justify-between gap-4">
          <Link
            to="/"
            className="font-serif text-lg tracking-tight text-foreground underline-offset-4 hover:underline"
          >
            Nucleus Concierge
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="space-y-8">
          <ProgressIndicator current={2} />
          <IdentityStep
            submitting={createMutation.isPending}
            onSubmit={(v) => createMutation.mutate(v)}
          />
          {createMutation.isError ? (
            <p className="text-sm text-destructive">
              We could not reach Supabase yet. Confirm environment keys and network,
              then try again.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
