import * as React from 'react'

import type { Session } from '@supabase/supabase-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'

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
import { leadDisplayName } from '@/features/admin/adminTypes'
import { primaryTypeDisplay } from '@/features/intake/leadLabels'
import { supabase } from '@/lib/supabase'

export function AdminMatchDetailPage() {
  useOutletContext<{ session: Session }>()
  const { matchId } = useParams()
  const id = matchId ?? ''
  const qc = useQueryClient()
  const [draft, setDraft] = React.useState<{ matchId: string; text: string } | null>(null)
  const [msg, setMsg] = React.useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['admin-match-detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: match, error: mErr } = await supabase
        .from('match_records')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (mErr) throw mErr
      if (!match) return null

      const { data: lead, error: lErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', match.lead_id)
        .maybeSingle()
      if (lErr) throw lErr
      if (!lead) throw new Error('Lead missing for match')

      const { data: introRows } = await supabase
        .from('introduction_requests')
        .select('id, request_kind, status, created_at')
        .eq('match_record_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
      const introReq = introRows?.[0] ?? null

      let person: {
        first_name: string | null
        last_name: string | null
        email: string | null
        title: string | null
        organization: string | null
        bio: string | null
      } | null = null
      let opportunity: {
        name: string
        type: string
        stage: string | null
        description: string | null
        organization: string | null
        contact_email: string | null
      } | null = null

      if (match.person_id) {
        const { data: p, error: pErr } = await supabase
          .from('people')
          .select(
            'first_name, last_name, email, title, organization, bio',
          )
          .eq('id', match.person_id)
          .maybeSingle()
        if (pErr) throw pErr
        person = p ?? null
      } else if (match.opportunity_id) {
        const { data: o, error: oErr } = await supabase
          .from('opportunities')
          .select('name, type, stage, description, organization, contact_email')
          .eq('id', match.opportunity_id)
          .maybeSingle()
        if (oErr) throw oErr
        opportunity = o ?? null
      }

      let introDraft = match.intro_email_draft
      if (!introDraft?.trim()) {
        const { data: gen, error: genErr } = await supabase.functions.invoke<{
          intro_email_draft?: string
          error?: string
        }>('generate-match-intro', { body: { match_id: id } })
        if (!genErr && gen?.intro_email_draft?.trim()) {
          introDraft = gen.intro_email_draft
        }
      }

      return {
        match: { ...match, intro_email_draft: introDraft ?? match.intro_email_draft },
        lead,
        person,
        opportunity,
        introReq: introReq ?? null,
      }
    },
  })

  const generateIntro = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        intro_email_draft?: string
        source?: 'llm' | 'template'
        error?: string
      }>('generate-match-intro', { body: { match_id: id } })
      if (error) throw error
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        throw new Error(String(data.error))
      }
      if (!data?.intro_email_draft?.trim()) {
        throw new Error('No draft returned')
      }
      return data
    },
    onSuccess: (data) => {
      setDraft({ matchId: id, text: data.intro_email_draft!.trim() })
      setMsg(
        data.source === 'llm'
          ? 'Generated intro (AI). Save or send when ready.'
          : 'Generated intro (template fallback). Save or send when ready.',
      )
      void qc.invalidateQueries({ queryKey: ['admin-match-detail', id] })
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : 'Generate failed'),
  })

  const saveDraft = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('match_records')
        .update({ intro_email_draft: text, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setMsg('Draft saved.')
      setDraft(null)
      void qc.invalidateQueries({ queryKey: ['admin-match-detail', id] })
      void qc.invalidateQueries({ queryKey: ['admin-lead-detail'] })
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : 'Save failed'),
  })

  const sendIntro = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean
        error?: string
        demo_only?: boolean
      }>('send-intro-email', { body: { match_id: id, intro_email_draft: text } })
      if (error) throw error
      if (data && 'error' in data && data.error) {
        throw new Error(data.error as string)
      }
      return data
    },
    onSuccess: () => {
      setMsg('Email sent (or queued via Resend).')
      setDraft(null)
      void qc.invalidateQueries({ queryKey: ['admin-match-detail', id] })
      void qc.invalidateQueries({ queryKey: ['admin-matches'] })
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : 'Send failed'),
  })

  if (!id) return <p className="text-sm text-destructive">Missing match id.</p>

  if (detailQuery.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Loading…
      </p>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Match not found.</p>
        <Link to="/admin/matches" className="text-sm text-primary hover:underline">
          Back to matches
        </Link>
      </div>
    )
  }

  const { match, lead, person, opportunity, introReq } = detailQuery.data
  const introText =
    draft && draft.matchId === id ? draft.text : (match.intro_email_draft ?? '')

  function handleRegenerate() {
    generateIntro.mutate()
  }

  const counterpartyEmail = person?.email?.trim() || opportunity?.contact_email?.trim() || null
  const leadEmailOk = Boolean(lead.email?.trim())

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <Link to={`/admin/leads/${lead.id}`} className="text-xs font-medium text-primary hover:underline">
          ← Lead: {leadDisplayName(lead)}
        </Link>
        <Link to="/admin/matches" className="ml-4 text-xs font-medium text-primary hover:underline">
          All matches
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Mutual introduction</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review both sides, edit the email, then send both parties a single introduction via Resend.
        </p>
      </div>

      {introReq ? (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
          Intake visitor requested: <strong>{introReq.request_kind.replace(/_/g, ' ')}</strong> ·{' '}
          status {introReq.status} · {new Date(introReq.created_at).toLocaleString()}
        </p>
      ) : null}

      {msg ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{msg}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">From intake</CardTitle>
            <CardDescription>Lead who went through Concierge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{leadDisplayName(lead)}</p>
            <p className="text-muted-foreground">{lead.email ?? 'No email'}</p>
            <p className="text-xs text-muted-foreground">
              {primaryTypeDisplay(lead.primary_type) ?? 'Unclassified'}
            </p>
            {lead.ai_summary ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lead.ai_summary}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {match.matched_record_type === 'person' ? 'Matched person' : 'Matched opportunity'}
            </CardTitle>
            <CardDescription>Counterparty for this intro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {person ? (
              <>
                <p className="font-medium">
                  {[person.first_name, person.last_name].filter(Boolean).join(' ') ||
                    person.email ||
                    'Contact'}
                </p>
                <p className="text-muted-foreground">{person.email ?? 'No email on file'}</p>
                <p className="text-xs text-muted-foreground">
                  {[person.title, person.organization].filter(Boolean).join(' · ') || '—'}
                </p>
                {person.bio ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
                ) : null}
                {person.email ? (
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" asChild>
                    <Link to={`/admin/people/${match.person_id}`}>Open person profile</Link>
                  </Button>
                ) : null}
              </>
            ) : opportunity ? (
              <>
                <p className="font-medium">{opportunity.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {opportunity.type.replace(/_/g, ' ')}
                  {opportunity.organization ? ` · ${opportunity.organization}` : ''}
                </p>
                <p className="text-muted-foreground">
                  Contact: {opportunity.contact_email ?? 'Set contact_email on opportunity to send'}
                </p>
                {opportunity.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {opportunity.description}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">Could not load counterparty.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Introduction email</CardTitle>
          <CardDescription>
            Drafts are generated with OpenAI when you open an empty match or click Regenerate. If the
            API is unavailable, a template fallback is used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!leadEmailOk || !counterpartyEmail ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-50">
              {!leadEmailOk ? 'Lead needs an email. ' : ''}
              {!counterpartyEmail
                ? match.matched_record_type === 'person'
                  ? 'Matched person needs an email on their profile. '
                  : 'Opportunity needs contact_email set. '
                : ''}
              Send stays disabled until both addresses exist.
            </p>
          ) : null}

          {match.intro_sent_at ? (
            <p className="text-xs text-muted-foreground">
              Last sent {new Date(match.intro_sent_at).toLocaleString()}. You can edit and send again
              if needed.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={generateIntro.isPending}
              onClick={handleRegenerate}
            >
              {generateIntro.isPending ? 'Generating…' : 'Regenerate with AI'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveDraft.isPending}
              onClick={() => saveDraft.mutate(introText)}
            >
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                sendIntro.isPending || !leadEmailOk || !counterpartyEmail || !introText.trim()
              }
              onClick={() => sendIntro.mutate(introText)}
            >
              {sendIntro.isPending ? 'Sending…' : 'Send via Resend'}
            </Button>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="intro-body">Body (plain text)</Label>
            <Textarea
              id="intro-body"
              value={introText}
              onChange={(e) => setDraft({ matchId: id, text: e.target.value })}
              rows={16}
              className="font-sans text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Configure Edge secrets: <code className="rounded bg-muted px-1">RESEND_API_KEY</code>,{' '}
            <code className="rounded bg-muted px-1">RESEND_FROM</code> (e.g.{' '}
            <code className="rounded bg-muted px-1">Nucleus &lt;noreply@yourdomain.com&gt;</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
