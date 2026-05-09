import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { personDisplayName } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import { supabase } from '@/lib/supabase'

export function AdminPersonDetailPage() {
  useOutletContext<{ session: Session }>()
  const { personId } = useParams()
  const id = personId ?? ''

  const detailQuery = useQuery({
    queryKey: ['admin-person', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: person, error: pErr } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (pErr) throw pErr
      if (!person) return { person: null }

      const { data: matches, error: mErr } = await supabase
        .from('match_records')
        .select('*')
        .eq('person_id', id)
        .order('created_at', { ascending: false })
      if (mErr) throw mErr

      let notes: { note: string; created_at: string }[] = []
      if (person.lead_id) {
        const { data: n, error: nErr } = await supabase
          .from('admin_notes')
          .select('note, created_at')
          .eq('lead_id', person.lead_id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (nErr) throw nErr
        notes = n ?? []
      }

      return { person, matches: matches ?? [], notes }
    },
  })

  if (!id) {
    return <p className="text-sm text-destructive">Missing person id.</p>
  }

  if (detailQuery.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Loading…
      </p>
    )
  }

  if (detailQuery.isError || !detailQuery.data?.person) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Person not found.</p>
        <Link to="/admin/people" className="text-sm text-primary hover:underline">
          Back to people
        </Link>
      </div>
    )
  }

  const { person, matches, notes } = detailQuery.data

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/people"
            className="text-xs font-medium text-primary hover:underline"
          >
            ← People
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {personDisplayName(person)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.email ?? 'No email'} · {person.organization ?? 'No organization'}
          </p>
        </div>
        {person.lead_id ? (
          <Link
            to={`/admin/leads/${person.lead_id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Open linked lead
          </Link>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Structured fields from intake or seed</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Types</p>
            <p>
              {(person.person_types ?? []).map((t) => primaryTypeDisplay(t) ?? t).join(', ') ||
                '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sectors</p>
            <p>{(person.sectors ?? []).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Skills</p>
            <p>{(person.skills ?? []).join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Source / status</p>
            <p className="capitalize">
              {person.source} · {person.status}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Bio</p>
            <p className="whitespace-pre-wrap">{person.bio ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match recommendations</CardTitle>
          <CardDescription>Where this person appears as a suggested intro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No matches reference this person yet.</p>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                className="rounded-md border border-border/80 bg-muted/20 px-3 py-2"
              >
                <p className="font-medium capitalize">{m.status.replace(/_/g, ' ')}</p>
                <Link
                  to={`/admin/leads/${m.lead_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View lead
                </Link>
                {m.why_this_fits ? (
                  <p className="mt-1 text-xs text-muted-foreground">{m.why_this_fits}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin notes</CardTitle>
          <CardDescription>
            {person.lead_id
              ? 'Notes are stored on the linked intake lead.'
              : 'No intake lead is linked — notes are unavailable until a lead exists.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {notes.length === 0 ? (
            <p className="text-muted-foreground">
              {person.lead_id ? 'No notes yet.' : '—'}
            </p>
          ) : (
            notes.map((n, i) => (
              <p key={`${n.created_at}-${i}`} className="rounded-md border border-border/60 p-2 text-sm">
                {n.note}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
