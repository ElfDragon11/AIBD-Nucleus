import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { leadDisplayName } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import { supabase } from '@/lib/supabase'

export function AdminLeadsPage() {
  useOutletContext<{ session: Session }>()
  const [search, setSearch] = React.useState('')
  const [review, setReview] = React.useState('')
  const [status, setStatus] = React.useState('')

  const query = useQuery({
    queryKey: ['admin-leads', search, review, status],
    queryFn: async () => {
      let q = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(400)

      if (review) q = q.eq('review_status', review)
      if (status) q = q.eq('status', status)

      const { data: rows, error } = await q
      if (error) throw error
      let list = rows ?? []
      const term = search.trim().toLowerCase()
      if (term) {
        list = list.filter((L) => {
          const blob = [
            L.first_name,
            L.last_name,
            L.email,
            L.ai_summary,
            L.raw_intent,
            L.primary_type,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return blob.includes(term)
        })
      }
      return list
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Intake review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming concierge submissions and AI summaries.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/30 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid flex-1 gap-2 min-w-[12rem]">
          <Label htmlFor="lead-search">Search</Label>
          <Input
            id="lead-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, summary…"
          />
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="lead-review">Review status</Label>
          <select
            id="lead-review"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_info">Needs info</option>
            <option value="bad_fit">Bad fit</option>
          </select>
        </div>
        <div className="grid gap-2 min-w-[10rem]">
          <Label htmlFor="lead-status">Lead status</Label>
          <select
            id="lead-status"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="intake_started">Intake started</option>
            <option value="intake_complete">Intake complete</option>
            <option value="recommendations_shown">Recommendations shown</option>
          </select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('')
            setReview('')
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
        <div className="grid gap-4">
          {(query.data ?? []).map((L) => (
            <Link
              key={L.id}
              to={`/admin/leads/${L.id}`}
              className="block rounded-lg border border-border bg-card/40 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{leadDisplayName(L)}</p>
                  <p className="text-xs text-muted-foreground">
                    {primaryTypeDisplay(L.primary_type) ?? 'Unclassified'} ·{' '}
                    <span className="capitalize">{L.review_status.replace(/_/g, ' ')}</span>
                    {' · '}
                    <span className="capitalize">{L.status.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(L.created_at).toLocaleString()}
                </p>
              </div>
              {L.bad_fit_risk ? (
                <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-900 dark:text-amber-50">
                  Bad-fit signal: {L.bad_fit_risk}
                </p>
              ) : null}
              {L.ai_summary ? (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{L.ai_summary}</p>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">No AI summary yet.</p>
              )}
            </Link>
          ))}
          {(query.data?.length ?? 0) === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No leads match filters.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
