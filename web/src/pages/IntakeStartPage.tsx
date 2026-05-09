import * as React from 'react'

import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PublicSiteHeader } from '@/components/brand/PublicSiteHeader'
import { IdentityStep } from '@/features/intake/IdentityStep'
import { IntakeStepFrame } from '@/features/intake/IntakeStepFrame'
import { ProgressIndicator } from '@/features/intake/ProgressIndicator'
import { createPublicLead } from '@/features/intake/publicLeadApi'
import {
  clearIntakeSession,
  getStoredIntakeSession,
  saveIntakeSession,
} from '@/features/intake/publicSession'
import type { IdentityFormValues } from '@/features/intake/schemas'
import { runWithViewTransition } from '@/lib/viewTransition'

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
      runWithViewTransition(() => {
        navigate(`/intake/${id}`)
      })
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
    <div className="min-h-svh bg-secondary">
      <PublicSiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          <ProgressIndicator current={2} />
          <IntakeStepFrame
            key="intake-identity"
            className="w-full bg-background p-6 sm:p-8"
          >
            <IdentityStep
              submitting={createMutation.isPending}
              onSubmit={(v) => createMutation.mutate(v)}
            />
          </IntakeStepFrame>
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
