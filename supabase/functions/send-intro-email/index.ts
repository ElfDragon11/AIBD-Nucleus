import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { edgeErrorObj } from '../_shared/edge_logger.ts'
import { createServiceClient, getAdminUserFromRequest } from '../_shared/supabase_admin.ts'

const FN = 'send-intro-email'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabase = createServiceClient()
    const admin = await getAdminUserFromRequest(supabase, req)
    if (!admin) {
      return jsonResponse({ error: 'Admin access required' }, 403)
    }

    const body = (await req.json()) as {
      match_id?: string
      intro_email_draft?: string
    }
    const matchId = body.match_id?.trim()
    if (!matchId) {
      return jsonResponse({ error: 'match_id is required' }, 400)
    }

    const { data: m, error: mErr } = await supabase
      .from('match_records')
      .select(
        'id, lead_id, intro_email_draft, intro_sent_at, matched_record_type, person_id, opportunity_id',
      )
      .eq('id', matchId)
      .maybeSingle()
    if (mErr) throw mErr
    if (!m) return jsonResponse({ error: 'Match not found' }, 404)

    const bodyText =
      body.intro_email_draft?.trim() || m.intro_email_draft?.trim() || ''
    if (!bodyText) {
      return jsonResponse({ error: 'No intro copy to send (draft is empty)' }, 400)
    }

    const { data: lead, error: lErr } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email')
      .eq('id', m.lead_id)
      .maybeSingle()
    if (lErr) throw lErr
    if (!lead?.email?.trim()) {
      return jsonResponse(
        { error: 'Lead has no email on file; add one before sending.' },
        400,
      )
    }

    let otherEmail: string | null = null
    if (m.person_id) {
      const { data: p, error: pErr } = await supabase
        .from('people')
        .select('email, first_name, last_name')
        .eq('id', m.person_id)
        .maybeSingle()
      if (pErr) throw pErr
      otherEmail = p?.email?.trim() ?? null
    } else if (m.opportunity_id) {
      const { data: o, error: oErr } = await supabase
        .from('opportunities')
        .select('contact_email, name')
        .eq('id', m.opportunity_id)
        .maybeSingle()
      if (oErr) throw oErr
      otherEmail = o?.contact_email?.trim() ?? null
    }

    if (!otherEmail) {
      return jsonResponse(
        {
          error:
            'Counterparty has no email: for people, add email on the person record; for opportunities, set contact_email.',
        },
        400,
      )
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM') ?? 'Nucleus Concierge <onboarding@resend.dev>'
    if (!apiKey?.trim()) {
      return jsonResponse(
        {
          error:
            'RESEND_API_KEY is not configured. Set it with: supabase secrets set RESEND_API_KEY=re_xxx',
          demo_only: true,
        },
        503,
      )
    }

    const leadName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'Colleague'
    const subject = `Introduction via Nucleus — ${leadName}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [lead.email.trim(), otherEmail],
        subject,
        text: bodyText,
      }),
    })

    const resJson = (await res.json()) as { message?: string; id?: string }
    if (!res.ok) {
      return jsonResponse(
        { error: resJson.message ?? `Resend error (${res.status})` },
        502,
      )
    }

    const now = new Date().toISOString()
    await supabase
      .from('match_records')
      .update({
        intro_email_draft: bodyText,
        intro_sent_at: now,
        updated_at: now,
      })
      .eq('id', matchId)

    return jsonResponse({
      ok: true,
      resend_id: resJson.id ?? null,
      intro_sent_at: now,
    })
  } catch (e) {
    edgeErrorObj(FN, 'unhandled', e)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
