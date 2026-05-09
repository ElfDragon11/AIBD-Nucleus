import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import { Loader2Icon } from 'lucide-react'

import { supabase } from '@/lib/supabase'

import { introRequestKindLabel } from '@/features/intake/introActions'

/** Latest `match_records.id` per lead (for intro requests created before we stored `match_record_id`). */
function newestMatchIdByLead(
  rows: { id: string; lead_id: string; created_at: string }[],
): Map<string, string> {
  const map = new Map<string, string>()
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  for (const row of sorted) {
    if (!map.has(row.lead_id)) map.set(row.lead_id, row.id)
  }
  return map
}

export function IntroductionRequestsPage() {
  const { session } = useOutletContext<{ session: Session }>()

  const { data: profile } = useQuery({
    queryKey: ['admin-users', session.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const listQuery = useQuery({
    queryKey: ['introduction-requests'],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('introduction_requests')
        .select(
          'id, lead_id, match_record_id, created_at, request_kind, target_title, status, matched_record_type, leads(first_name, last_name, email)',
        )
        .order('created_at', { ascending: false })
        .limit(300)
      if (error) throw error
      return data ?? []
    },
  })

  const leadIdsForFallback = useMemo(
    () => [...new Set((listQuery.data ?? []).map((r) => r.lead_id))],
    [listQuery.data],
  )

  const fallbackMatchesQuery = useQuery({
    queryKey: [
      'introduction-requests-fallback-matches',
      [...leadIdsForFallback].sort().join(','),
    ],
    enabled:
      Boolean(profile) && leadIdsForFallback.length > 0 && listQuery.isSuccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_records')
        .select('id, lead_id, created_at')
        .in('lead_id', leadIdsForFallback)
      if (error) throw error
      return newestMatchIdByLead(data ?? [])
    },
  })

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">
        Admin profile required. See{' '}
        <Link className="underline" to="/admin">
          overview
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-foreground">
          Introduction requests
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logged when someone on the public recommendations page asks Nucleus to run an intro,
          program connection, or working-session opener. Use{' '}
          <strong className="font-medium text-foreground">Intro workspace</strong> to open the
          mutual email view (we link the stored match when present, otherwise the newest match for
          that lead).
        </p>
      </div>

      {listQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : listQuery.isError ? (
        <p className="text-sm text-destructive">Could not load requests.</p>
      ) : !listQuery.data?.length ? (
        <p className="rounded-md border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          No introduction requests yet. They appear here when leads use the action button on{' '}
          <code className="text-xs">/recommendations/:leadId</code>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Lead</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Match type</th>
                <th className="px-3 py-2 font-medium">Open</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data.map((row) => {
                const lead = row.leads
                const leadLabel =
                  [lead?.first_name, lead?.last_name].filter(Boolean).join(' ') ||
                  lead?.email ||
                  '—'
                const workspaceId =
                  row.match_record_id ??
                  fallbackMatchesQuery.data?.get(row.lead_id) ??
                  null
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        className="font-medium text-primary hover:underline"
                        to={`/admin/leads/${row.lead_id}`}
                      >
                        {leadLabel}
                      </Link>
                      {lead?.email ? (
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {introRequestKindLabel(row.request_kind)}
                    </td>
                    <td className="max-w-[220px] px-3 py-2 font-medium leading-snug">
                      {row.target_title}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.matched_record_type ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {workspaceId ? (
                        <Link
                          className="font-medium text-primary hover:underline"
                          to={`/admin/matches/${workspaceId}`}
                        >
                          Intro workspace
                        </Link>
                      ) : fallbackMatchesQuery.isPending ? (
                        <span className="text-xs text-muted-foreground">Resolving…</span>
                      ) : (
                        <Link
                          className="font-medium text-primary hover:underline"
                          to={`/admin/leads/${row.lead_id}`}
                        >
                          Open lead
                        </Link>
                      )}
                      {row.match_record_id ? null : workspaceId ? (
                        <div className="text-[11px] text-muted-foreground">
                          Linked via newest match for lead
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 capitalize">{row.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
