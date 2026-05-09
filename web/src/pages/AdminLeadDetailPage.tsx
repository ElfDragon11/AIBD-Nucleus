import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

import { AffinityPayloadPreview } from '@/components/admin/AffinityPayloadPreview'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  leadDisplayName,
  matchStatusLabel,
} from '@/features/admin/adminTypes'
import {
  type AffinityPreviewEntity,
  buildAffinityPayload,
} from '@/features/admin/affinityPayload'
import { buildIntroDraftFromContext } from '@/features/admin/introDraft'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

type LeadRow = Database['public']['Tables']['leads']['Row']
type MatchRow = Database['public']['Tables']['match_records']['Row']

export function AdminLeadDetailPage() {
  const { session } = useOutletContext<{ session: Session }>()
  const { leadId } = useParams()
  const id = leadId ?? ''
  const qc = useQueryClient()

  const [introDraft, setIntroDraft] = React.useState<{
    leadId: string
    text: string
  } | null>(null)
  const [noteDraft, setNoteDraft] = React.useState('')
  const [affinityOpen, setAffinityOpen] = React.useState(false)
  const [affinitySynced, setAffinitySynced] = React.useState(false)
  const [actionMsg, setActionMsg] = React.useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['admin-lead-detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: lead, error: e1 } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (e1) throw e1
      if (!lead) return null

      const [
        messagesRes,
        fieldsRes,
        matchesRes,
        notesRes,
        adminRowRes,
      ] = await Promise.all([
        supabase
          .from('intake_messages')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('lead_profile_fields')
          .select('*')
          .eq('lead_id', id)
          .order('field_key', { ascending: true }),
        supabase.from('match_records').select('*').eq('lead_id', id),
        supabase
          .from('admin_notes')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('admin_users')
          .select('id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle(),
      ])

      for (const r of [messagesRes, fieldsRes, matchesRes, notesRes, adminRowRes]) {
        if (r.error) throw r.error
      }

      const matches = matchesRes.data ?? []
      const personIds = [...new Set(matches.map((m) => m.person_id).filter(Boolean))] as string[]
      const oppIds = [...new Set(matches.map((m) => m.opportunity_id).filter(Boolean))] as string[]

      const [peopleRes, oppsRes] = await Promise.all([
        personIds.length
          ? supabase
              .from('people')
              .select('id, first_name, last_name, email, organization')
              .in('id', personIds)
          : { data: [], error: null },
        oppIds.length
          ? supabase
              .from('opportunities')
              .select('id, name, type, organization')
              .in('id', oppIds)
          : { data: [], error: null },
      ])
      if (peopleRes.error) throw peopleRes.error
      if (oppsRes.error) throw oppsRes.error

      const peopleById = new Map((peopleRes.data ?? []).map((p) => [p.id, p]))
      const oppsById = new Map((oppsRes.data ?? []).map((o) => [o.id, o]))

      const enrichedMatches = matches.map((m) => {
        if (m.matched_record_type === 'person') {
          const p = peopleById.get(m.matched_record_id)
          const targetLabel =
            p != null
              ? [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                p.email ||
                p.organization ||
                m.matched_record_id
              : m.matched_record_id
          return { ...m, targetLabel }
        }
        const o = oppsById.get(m.matched_record_id)
        const targetLabel = o?.name ?? m.matched_record_id
        return { ...m, targetLabel }
      })

      return {
        lead,
        messages: messagesRes.data ?? [],
        fields: fieldsRes.data ?? [],
        matches: enrichedMatches,
        notes: notesRes.data ?? [],
        adminUserId: adminRowRes.data?.id ?? null,
        peopleById,
        oppsById,
      }
    },
  })

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['admin-lead-detail', id] })

  const updateMatchStatus = useMutation({
    mutationFn: async ({ mid, status }: { mid: string; status: string }) => {
      const { error } = await supabase
        .from('match_records')
        .update({ status })
        .eq('id', mid)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateLead = useMutation({
    mutationFn: async (patch: Partial<LeadRow>) => {
      const { error } = await supabase.from('leads').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
      void qc.invalidateQueries({ queryKey: ['admin-leads'] })
      void qc.invalidateQueries({ queryKey: ['admin-matches'] })
    },
  })

  const saveIntro = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ intro_draft: text })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setIntroDraft(null)
      setActionMsg('Intro draft saved.')
      invalidate()
    },
    onError: (e) =>
      setActionMsg(e instanceof Error ? e.message : 'Could not save intro draft'),
  })

  const addNote = useMutation({
    mutationFn: async (adminUserId: string) => {
      const text = noteDraft.trim()
      if (!text) throw new Error('Note is empty')
      const { error } = await supabase.from('admin_notes').insert({
        lead_id: id,
        admin_user_id: adminUserId,
        note: text,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setNoteDraft('')
      setActionMsg('Note added.')
      invalidate()
    },
    onError: (e) =>
      setActionMsg(e instanceof Error ? e.message : 'Could not add note'),
  })

  const rerunMatching = useMutation({
    mutationFn: async (vars: { leadId: string; publicSessionId: string }) => {
      const { data, error } = await supabase.functions.invoke('find-matches', {
        body: {
          lead_id: vars.leadId,
          public_session_id: vars.publicSessionId,
          limit: 6,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setActionMsg('Matching finished. Refreshing data…')
      invalidate()
      void qc.invalidateQueries({ queryKey: ['admin-matches'] })
      void qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (e) => {
      const msg =
        e instanceof Error && e.message.toLowerCase().includes('failed')
          ? e.message
          : 'Matching may not be deployed yet (find-matches Edge Function).'
      setActionMsg(msg)
    },
  })

  if (!id) {
    return <p className="text-sm text-destructive">Missing lead id.</p>
  }

  if (detailQuery.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Loading lead…
      </p>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Lead not found.</p>
        <Link to="/admin/leads" className="text-sm text-primary hover:underline">
          Back to intake review
        </Link>
      </div>
    )
  }

  const { lead, messages, fields, matches, notes, adminUserId, peopleById, oppsById } =
    detailQuery.data

  const introText =
    introDraft && introDraft.leadId === lead.id
      ? introDraft.text
      : (lead.intro_draft ?? '')

  function handleGenerateIntro() {
    const peopleMapLite = new Map(
      [...peopleById.entries()].map(([k, v]) => [k, v]),
    )
    const oppMapLite = new Map([...oppsById.entries()].map(([k, v]) => [k, v]))
    const text = buildIntroDraftFromContext({
      lead,
      matches: matches.map((m) => {
        const row = { ...m }
        delete (row as { targetLabel?: string }).targetLabel
        return row as MatchRow
      }),
      peopleById: peopleMapLite,
      opportunitiesById: oppMapLite,
    })
    setIntroDraft({ leadId: lead.id, text })
    setActionMsg('Draft generated — review and save.')
  }

  const affinityEntities: AffinityPreviewEntity[] = []
  for (const m of matches) {
    if (m.matched_record_type === 'person') {
      const p = peopleById.get(m.matched_record_id)
      if (!p) continue
      affinityEntities.push({
        kind: 'person',
        id: p.id,
        name:
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          p.email ||
          'Person',
        email: p.email,
        organization: p.organization,
      })
    } else {
      const o = oppsById.get(m.matched_record_id)
      if (!o) continue
      affinityEntities.push({
        kind: 'opportunity',
        id: o.id,
        name: o.name,
        type: o.type,
        organization: o.organization,
      })
    }
  }

  const tags = [
    ...(lead.primary_type ? [primaryTypeDisplay(lead.primary_type) ?? lead.primary_type] : []),
    ...(lead.secondary_types ?? []).map((s) => primaryTypeDisplay(s) ?? s),
  ].filter(Boolean) as string[]

  const affinityPayload = buildAffinityPayload({
    lead,
    recommendations: matches.map((m) => ({
      matched_record_type: m.matched_record_type,
      matched_record_id: m.matched_record_id,
      why_this_fits: m.why_this_fits,
      best_next_step: m.best_next_step,
      status: m.status,
      overall_score: m.overall_score,
      confidence_label: m.confidence_label,
    })),
    entities: affinityEntities,
    tags,
    suggestedNextAction:
      lead.review_status === 'pending'
        ? 'Review matches and approve the strongest fits.'
        : 'Sync approved matches to Affinity when ready.',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {affinityOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="affinity-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-5 shadow-lg">
            <h2 id="affinity-title" className="text-lg font-semibold">
              Mock Affinity sync
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview-only payload — no data leaves this browser demo.
            </p>
            <div className="mt-4">
              <AffinityPayloadPreview payload={affinityPayload} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setAffinitySynced(true)
                  setActionMsg('Ready to sync / recorded for demo.')
                }}
              >
                {affinitySynced ? 'Synced (mock)' : 'Sync to Affinity'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setAffinityOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/leads"
            className="text-xs font-medium text-primary hover:underline"
          >
            ← Intake review
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{leadDisplayName(lead)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.email ?? 'No email'} · Created {new Date(lead.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAffinityOpen(true)}>
            Affinity preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={rerunMatching.isPending}
            onClick={() =>
              rerunMatching.mutate({
                leadId: lead.id,
                publicSessionId: lead.public_session_id,
              })
            }
          >
            {rerunMatching.isPending ? 'Running…' : 'Rerun matching'}
          </Button>
        </div>
      </div>

      {actionMsg ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{actionMsg}</p>
      ) : null}

      {!adminUserId ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-50">
          Add your account to <code className="font-mono">admin_users</code> to post notes.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>Classification and review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Primary type</p>
              <p>{primaryTypeDisplay(lead.primary_type) ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Secondary types</p>
              <p>
                {(lead.secondary_types ?? [])
                  .map((s) => primaryTypeDisplay(s) ?? s)
                  .join(', ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lead status</p>
              <p className="capitalize">{lead.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profile confidence</p>
              <p>{lead.profile_confidence ?? '—'}</p>
            </div>
          </div>
          {lead.ai_summary ? (
            <div>
              <p className="text-xs text-muted-foreground">AI summary</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{lead.ai_summary}</p>
            </div>
          ) : null}
          {lead.bad_fit_risk ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-50">
              Bad-fit risk: {lead.bad_fit_risk}
            </p>
          ) : null}

          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="review-status">Review status</Label>
            <select
              id="review-status"
              className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={lead.review_status}
              onChange={(e) =>
                updateLead.mutate({ review_status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="needs_info">Needs info</option>
              <option value="bad_fit">Bad fit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intro draft</CardTitle>
          <CardDescription>Email-style copy for human-approved intros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleGenerateIntro}>
              Generate from context
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void navigator.clipboard.writeText(introText).then(
                  () => setActionMsg('Copied intro to clipboard.'),
                  () => setActionMsg('Could not copy to clipboard.'),
                )
              }
            >
              Copy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveIntro.isPending}
              onClick={() => saveIntro.mutate(introText)}
            >
              Save draft
            </Button>
          </div>
          <Textarea
            value={introText}
            onChange={(e) => setIntroDraft({ leadId: lead.id, text: e.target.value })}
            rows={12}
            className="font-sans text-sm"
            placeholder="Draft intro email…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intake transcript</CardTitle>
          <CardDescription>Messages in order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {messages.length === 0 ? (
            <p className="text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-md border border-border/80 bg-muted/20 px-3 py-2"
              >
                <p className="text-xs font-medium capitalize text-muted-foreground">
                  {msg.sender} · {new Date(msg.created_at).toLocaleString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Structured profile fields</CardTitle>
          <CardDescription>AI-extracted keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono text-xs">
          {fields.length === 0 ? (
            <p className="font-sans text-muted-foreground">No profile fields yet.</p>
          ) : (
            fields.map((f) => (
              <div key={f.id} className="rounded border border-border/60 p-2">
                <p className="font-sans text-[11px] font-semibold text-foreground">{f.field_key}</p>
                <pre className="mt-1 overflow-x-auto text-[11px] text-muted-foreground">
                  {JSON.stringify(f.field_value, null, 2)}
                </pre>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matches</CardTitle>
          <CardDescription>Approve, hold, or reject recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches for this lead yet.</p>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-border bg-muted/15 p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {m.matched_record_type === 'person' ? 'Person' : 'Opportunity'}:{' '}
                      {m.targetLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {matchStatusLabel(m.status)}
                      {m.confidence_label ? ` · ${m.confidence_label}` : ''}
                      {m.overall_score != null ? ` · score ${m.overall_score}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="secondary" asChild>
                      <Link to={`/admin/matches/${m.id}`}>Intro email</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={m.status === 'approved' ? 'default' : 'outline'}
                      disabled={updateMatchStatus.isPending}
                      onClick={() => updateMatchStatus.mutate({ mid: m.id, status: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={m.status === 'hold' ? 'secondary' : 'outline'}
                      disabled={updateMatchStatus.isPending}
                      onClick={() => updateMatchStatus.mutate({ mid: m.id, status: 'hold' })}
                    >
                      Hold
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={m.status === 'rejected' ? 'destructive' : 'outline'}
                      disabled={updateMatchStatus.isPending}
                      onClick={() => updateMatchStatus.mutate({ mid: m.id, status: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                {m.why_this_fits ? (
                  <p className="mt-2 text-sm text-muted-foreground">{m.why_this_fits}</p>
                ) : null}
                {m.best_next_step ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Next step: {m.best_next_step}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin notes</CardTitle>
          <CardDescription>Internal team context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder="Add a note…"
              disabled={!adminUserId}
            />
            <Button
              type="button"
              size="sm"
              disabled={!adminUserId || addNote.isPending}
              onClick={() => {
                if (adminUserId) addNote.mutate(adminUserId)
              }}
            >
              Add note
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            {notes.length === 0 ? (
              <p className="text-muted-foreground">No notes yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded-md border border-border/60 p-3">
                  <p className="whitespace-pre-wrap">{n.note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
