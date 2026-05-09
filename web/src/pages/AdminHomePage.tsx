import type { Session } from '@supabase/supabase-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export function AdminHomePage() {
  const queryClient = useQueryClient()
  const { session } = useOutletContext<{ session: Session }>()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  const { data: profile, isPending } = useQuery({
    queryKey: ['admin-users', session.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: seedStats, isPending: seedPending } = useQuery({
    queryKey: ['seed-stats', 'people-opportunities'],
    enabled: Boolean(profile),
    queryFn: async () => {
      const [people, opportunities] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      ])
      if (people.error) throw people.error
      if (opportunities.error) throw opportunities.error
      return {
        people: people.count ?? 0,
        opportunities: opportunities.count ?? 0,
      }
    },
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-4 py-16">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Signed in</CardTitle>
          <CardDescription>
            Session validates against Supabase; below reads your{' '}
            <code className="text-xs">admin_users</code> row if one exists after
            SQL bootstrap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <dl className="grid gap-1">
            <dt className="text-muted-foreground">Auth UID</dt>
            <dd className="font-mono text-xs">{session.user.id}</dd>
            <dt className="mt-3 text-muted-foreground">Email</dt>
            <dd>{session.user.email}</dd>
          </dl>
          {isPending ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Checking admin_users…
            </p>
          ) : profile ? (
            <div className="space-y-3">
              <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed">
                Row <strong className="font-mono">{profile.id}</strong> · role{' '}
                <strong>{profile.role}</strong>
              </p>
              {seedPending ? (
                <p className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Loading seed counts…
                </p>
              ) : seedStats ? (
                <p className="rounded-md border border-border px-3 py-2 text-xs leading-relaxed">
                  Phase 2 seed:{' '}
                  <strong>{seedStats.people}</strong> people,{' '}
                  <strong>{seedStats.opportunities}</strong> opportunities (expects 8 each
                  after <code className="text-[10px]">db reset</code>).
                </p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-50">
              No <code>admin_users</code> row matched this auth user yet. Paste the
              insert from{' '}
              <code className="font-mono text-[11px]">supabase/seed.sql</code>{' '}
              into Dashboard SQL Editor.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/">← Home</Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={signOutMutation.isPending}
          onClick={() => signOutMutation.mutate()}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
