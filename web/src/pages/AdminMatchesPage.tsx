import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { leadDisplayName, matchStatusLabel } from '@/features/admin/adminTypes'
import { supabase } from '@/lib/supabase'

type MatchEnriched = {
  id: string
  lead_id: string
  matched_record_type: string
  matched_record_id: string
  status: string
  why_this_fits: string | null
  overall_score: number | null
  confidence_label: string | null
  created_at: string
  lead: { first_name: string | null; last_name: string | null; email: string | null } | null
  targetLabel: string
}

export function AdminMatchesPage() {
  useOutletContext<{ session: Session }>()
  const [statusFilter, setStatusFilter] = React.useState('')

  const query = useQuery({
    queryKey: ['admin-matches', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('match_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (statusFilter) q = q.eq('status', statusFilter)

      const { data: matches, error } = await q
      if (error) throw error
      const list = matches ?? []

      const leadIds = [...new Set(list.map((m) => m.lead_id))]
      const personIds = [...new Set(list.map((m) => m.person_id).filter(Boolean))] as string[]
      const oppIds = [...new Set(list.map((m) => m.opportunity_id).filter(Boolean))] as string[]

      const [leadsRes, peopleRes, oppsRes] = await Promise.all([
        leadIds.length
          ? supabase
              .from('leads')
              .select('id, first_name, last_name, email')
              .in('id', leadIds)
          : Promise.resolve({ data: [] as const, error: null }),
        personIds.length
          ? supabase
              .from('people')
              .select('id, first_name, last_name, email, organization')
              .in('id', personIds)
          : Promise.resolve({ data: [] as const, error: null }),
        oppIds.length
          ? supabase.from('opportunities').select('id, name, type').in('id', oppIds)
          : Promise.resolve({ data: [] as const, error: null }),
      ])

      if (leadsRes.error) throw leadsRes.error
      if (peopleRes.error) throw peopleRes.error
      if (oppsRes.error) throw oppsRes.error

      const leadMap = new Map((leadsRes.data ?? []).map((x) => [x.id, x]))
      const peopleMap = new Map((peopleRes.data ?? []).map((x) => [x.id, x]))
      const oppMap = new Map((oppsRes.data ?? []).map((x) => [x.id, x]))

      const enriched: MatchEnriched[] = list.map((m) => {
        let targetLabel: string
        if (m.matched_record_type === 'person') {
          const p = peopleMap.get(m.matched_record_id)
          targetLabel = p
            ? [p.first_name, p.last_name].filter(Boolean).join(' ') ||
              p.email ||
              p.organization ||
              m.matched_record_id
            : m.matched_record_id
        } else {
          const o = oppMap.get(m.matched_record_id)
          targetLabel = o?.name ?? m.matched_record_id
        }
        return {
          id: m.id,
          lead_id: m.lead_id,
          matched_record_type: m.matched_record_type,
          matched_record_id: m.matched_record_id,
          status: m.status,
          why_this_fits: m.why_this_fits,
          overall_score: m.overall_score,
          confidence_label: m.confidence_label,
          created_at: m.created_at,
          lead: leadMap.get(m.lead_id) ?? null,
          targetLabel,
        }
      })

      return enriched
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Matches</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generated recommendations across all leads.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/30 p-4">
        <div className="grid gap-2">
          <Label htmlFor="match-status">Status</Label>
          <select
            id="match-status"
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="generated">Generated</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="hold">Hold</option>
            <option value="intro_drafted">Intro drafted</option>
            <option value="synced">Synced</option>
          </select>
        </div>
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Lead</th>
                <th className="px-3 py-2 font-medium">Match type</th>
                <th className="px-3 py-2 font-medium">Matched to</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Intro</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((m) => (
                <tr key={m.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <Link
                      to={`/admin/leads/${m.lead_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {m.lead
                        ? leadDisplayName({
                            first_name: m.lead.first_name,
                            last_name: m.lead.last_name,
                            email: m.lead.email,
                          })
                        : 'Lead'}
                    </Link>
                  </td>
                  <td className="px-3 py-2 capitalize">{m.matched_record_type}</td>
                  <td className="max-w-[14rem] truncate px-3 py-2">{m.targetLabel}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {m.confidence_label ?? (m.overall_score != null ? String(m.overall_score) : '—')}
                  </td>
                  <td className="px-3 py-2">{matchStatusLabel(m.status)}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/admin/matches/${m.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(query.data?.length ?? 0) === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No matches yet.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
