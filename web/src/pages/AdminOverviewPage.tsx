import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import { supabase } from '@/lib/supabase'

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

export function AdminOverviewPage() {
  useOutletContext<{ session: Session }>()

  const overviewQuery = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const iso = sevenDaysAgo.toISOString()

      const [
        peopleCount,
        oppCount,
        leadsTotal,
        leadsRecent,
        leadsPending,
        leadsLowConfidence,
        matchesTotal,
        matchRowsRes,
      ] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }),
        supabase.from('opportunities').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', iso),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('review_status', 'pending'),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .or('profile_confidence.is.null,profile_confidence.lt.0.45'),
        supabase.from('match_records').select('id', { count: 'exact', head: true }),
        supabase.from('match_records').select('status, confidence_label'),
      ])

      for (const r of [
        peopleCount,
        oppCount,
        leadsTotal,
        leadsRecent,
        leadsPending,
        leadsLowConfidence,
        matchesTotal,
        matchRowsRes,
      ]) {
        if (r.error) throw r.error
      }

      const matchRows = matchRowsRes.data

      const statusCounts: Record<string, number> = {}
      let highSignalMatches = 0
      for (const row of matchRows ?? []) {
        statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
        if (
          row.status === 'approved' ||
          row.confidence_label?.toLowerCase() === 'high'
        ) {
          highSignalMatches += 1
        }
      }

      const { data: typeRows } = await supabase
        .from('leads')
        .select('primary_type')
        .not('primary_type', 'is', null)

      const byType: Record<string, number> = {}
      for (const row of typeRows ?? []) {
        const k = row.primary_type ?? 'unknown'
        byType[k] = (byType[k] ?? 0) + 1
      }

      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, primary_type, created_at, review_status')
        .order('created_at', { ascending: false })
        .limit(6)

      const { data: recentMatches } = await supabase
        .from('match_records')
        .select('id, lead_id, matched_record_type, status, created_at, why_this_fits')
        .order('created_at', { ascending: false })
        .limit(6)

      return {
        people: peopleCount.count ?? 0,
        opportunities: oppCount.count ?? 0,
        leadsTotal: leadsTotal.count ?? 0,
        leadsRecent: leadsRecent.count ?? 0,
        leadsPending: leadsPending.count ?? 0,
        leadsLowConfidence: leadsLowConfidence.count ?? 0,
        matchesTotal: matchesTotal.count ?? 0,
        matchStatusCounts: statusCounts,
        highSignalMatches,
        leadsByPrimaryType: byType,
        recentLeads: recentLeads ?? [],
        recentMatches: recentMatches ?? [],
      }
    },
  })

  if (overviewQuery.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Loading overview…
      </div>
    )
  }

  if (overviewQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {overviewQuery.error instanceof Error
          ? overviewQuery.error.message
          : 'Failed to load overview'}
      </p>
    )
  }

  const d = overviewQuery.data

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submissions, matches, and recent activity across Concierge.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="New leads (7 days)" value={d.leadsRecent} />
        <Metric label="Pending review" value={d.leadsPending} />
        <Metric label="Low-confidence profiles" value={d.leadsLowConfidence} />
        <Metric label="Total matches" value={d.matchesTotal} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="People in CRM" value={d.people} />
        <Metric label="Opportunities" value={d.opportunities} />
        <Metric label="All leads" value={d.leadsTotal} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match statuses</CardTitle>
            <CardDescription>Counts by workflow state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(d.matchStatusCounts).length === 0 ? (
              <p className="text-muted-foreground">No matches yet.</p>
            ) : (
              Object.entries(d.matchStatusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-border/60 py-1.5 last:border-0"
                  >
                    <span className="capitalize text-muted-foreground">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium tabular-nums">{v}</span>
                  </div>
                ))
            )}
            <p className="pt-2 text-xs text-muted-foreground">
              High-signal items (approved or high confidence):{' '}
              <strong>{d.highSignalMatches}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by primary type</CardTitle>
            <CardDescription>Classified submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(d.leadsByPrimaryType).length === 0 ? (
              <p className="text-muted-foreground">No classified leads yet.</p>
            ) : (
              Object.entries(d.leadsByPrimaryType)
                .sort((a, b) => b[1] - a[1])
                .map(([slug, v]) => (
                  <div
                    key={slug}
                    className="flex justify-between border-b border-border/60 py-1.5 last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {primaryTypeDisplay(slug) ?? slug}
                    </span>
                    <span className="font-medium tabular-nums">{v}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent leads</CardTitle>
              <CardDescription>Newest submissions</CardDescription>
            </div>
            <Link
              to="/admin/leads"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {d.recentLeads.length === 0 ? (
              <p className="text-muted-foreground">No leads yet.</p>
            ) : (
              d.recentLeads.map((L) => (
                <Link
                  key={L.id}
                  to={`/admin/leads/${L.id}`}
                  className="block rounded-md border border-border/80 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <p className="font-medium text-foreground">
                    {[L.first_name, L.last_name].filter(Boolean).join(' ') ||
                      L.email ||
                      'Lead'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {primaryTypeDisplay(L.primary_type) ?? 'Unclassified'} ·{' '}
                    {L.review_status} · {new Date(L.created_at).toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent matches</CardTitle>
              <CardDescription>Latest recommendations</CardDescription>
            </div>
            <Link
              to="/admin/matches"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {d.recentMatches.length === 0 ? (
              <p className="text-muted-foreground">No matches yet.</p>
            ) : (
              d.recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border border-border/80 bg-muted/20 px-3 py-2"
                >
                  <p className="font-medium text-foreground capitalize">
                    {m.matched_record_type} · {m.status.replace(/_/g, ' ')}
                  </p>
                  <Link
                    to={`/admin/leads/${m.lead_id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Open lead
                  </Link>
                  {m.why_this_fits ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.why_this_fits}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
