import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

/** Wraps Phase 6 admin dashboard routes behind Supabase Auth. */
export function AdminAuthGate() {
  const location = useLocation()
  const [session, setSession] = useState<Session | null | undefined>(
    undefined,
  )

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null)
    })

    const { data } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (mounted) setSession(nextSession)
      },
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) {
    return (
      <output
        className="flex min-h-svh items-center justify-center text-sm text-muted-foreground"
        aria-live="polite"
      >
        Checking session…
      </output>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet context={{ session }} />
}
