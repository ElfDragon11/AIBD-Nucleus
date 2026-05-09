import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { personDisplayName } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import { supabase } from '@/lib/supabase'

export function AdminPeoplePage() {
  useOutletContext<{ session: Session }>()
  const [search, setSearch] = React.useState('')
  const [source, setSource] = React.useState<string>('')
  const [status, setStatus] = React.useState<string>('')

  const peopleQuery = useQuery({
    queryKey: ['admin-people', search, source, status],
    queryFn: async () => {
      let q = supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)

      if (source) q = q.eq('source', source)
      if (status) q = q.eq('status', status)

      const { data: rows, error } = await q
      if (error) throw error
      let list = rows ?? []
      const term = search.trim().toLowerCase()
      if (term) {
        list = list.filter((p) => {
          const blob = [
            p.first_name,
            p.last_name,
            p.email,
            p.organization,
            (p.person_types ?? []).join(' '),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return blob.includes(term)
        })
      }

      const { data: matchRows, error: mErr } = await supabase
        .from('match_records')
        .select('person_id')
        .not('person_id', 'is', null)

      if (mErr) throw mErr

      const matchCount = new Map<string, number>()
      for (const m of matchRows ?? []) {
        if (m.person_id) {
          matchCount.set(m.person_id, (matchCount.get(m.person_id) ?? 0) + 1)
        }
      }

      return list.map((p) => ({
        ...p,
        _matchCount: matchCount.get(p.id) ?? 0,
      }))
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lightweight CRM view — intake-linked and seed contacts.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/30 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid flex-1 gap-2 min-w-[12rem]">
          <Label htmlFor="people-search">Search</Label>
          <Input
            id="people-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, types…"
          />
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="people-source">Source</Label>
          <select
            id="people-source"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">All</option>
            <option value="public_intake">Public intake</option>
            <option value="manual">Manual</option>
            <option value="csv_import">CSV import</option>
          </select>
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="people-status">Status</Label>
          <select
            id="people-status"
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
            setSource('')
            setStatus('')
          }}
        >
          Clear filters
        </Button>
      </div>

      {peopleQuery.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Loading…
        </p>
      ) : peopleQuery.isError ? (
        <p className="text-sm text-destructive">
          {peopleQuery.error instanceof Error
            ? peopleQuery.error.message
            : 'Failed to load'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Types</th>
                <th className="px-3 py-2 font-medium">Organization</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Matches</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(peopleQuery.data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <Link
                      to={`/admin/people/${p.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {personDisplayName(p)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.email ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {(p.person_types ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="mr-1 inline-block">
                        {primaryTypeDisplay(t) ?? t}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2">{p.organization ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.source}</td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p._matchCount}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(peopleQuery.data?.length ?? 0) === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No people match these filters.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
