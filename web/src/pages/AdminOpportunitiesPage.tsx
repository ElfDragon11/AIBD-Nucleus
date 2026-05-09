import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export function AdminOpportunitiesPage() {
  useOutletContext<{ session: Session }>()
  const [search, setSearch] = React.useState('')
  const [type, setType] = React.useState('')
  const [status, setStatus] = React.useState('')

  const query = useQuery({
    queryKey: ['admin-opportunities', search, type, status],
    queryFn: async () => {
      let q = supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)

      if (type) q = q.eq('type', type)
      if (status) q = q.eq('status', status)

      const { data: rows, error } = await q
      if (error) throw error
      let list = rows ?? []
      const term = search.trim().toLowerCase()
      if (term) {
        list = list.filter((o) => {
          const blob = [
            o.name,
            o.description,
            o.organization,
            (o.sector ?? []).join(' '),
            o.type,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return blob.includes(term)
        })
      }

      const { data: matchRows, error: mErr } = await supabase
        .from('match_records')
        .select('opportunity_id')
        .not('opportunity_id', 'is', null)
      if (mErr) throw mErr

      const matchCount = new Map<string, number>()
      for (const m of matchRows ?? []) {
        if (m.opportunity_id) {
          matchCount.set(m.opportunity_id, (matchCount.get(m.opportunity_id) ?? 0) + 1)
        }
      }

      return list.map((o) => ({
        ...o,
        _matchCount: matchCount.get(o.id) ?? 0,
      }))
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Startups, programs, and needs in the matching inventory.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/30 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid flex-1 gap-2 min-w-[12rem]">
          <Label htmlFor="opp-search">Search</Label>
          <Input
            id="opp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, sector, org…"
          />
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="opp-type">Type</Label>
          <select
            id="opp-type"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All</option>
            <option value="startup_need">Startup need</option>
            <option value="research_project">Research project</option>
            <option value="internship">Internship</option>
            <option value="advisory_need">Advisory need</option>
            <option value="investor_opportunity">Investor opportunity</option>
            <option value="mentorship_need">Mentorship need</option>
            <option value="service_need">Service need</option>
            <option value="program">Program</option>
          </select>
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="opp-status">Status</Label>
          <select
            id="opp-status"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('')
            setType('')
            setStatus('')
          }}
        >
          Clear filters
        </Button>
      </div>

      {query.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : 'Failed to load'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Organization</th>
                <th className="px-3 py-2 font-medium">Sector</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Matches</th>
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((o) => (
                <tr key={o.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{o.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.type.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2">{o.organization ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {(o.sector ?? []).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2">{o.stage ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">{o.status}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o._matchCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(query.data?.length ?? 0) === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No opportunities match these filters.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
