/** Plain-text mutual introduction email (lead from intake ↔ matched person or opportunity). */

function safeName(first: string | null, last: string | null, fallback: string) {
  const n = [first, last].filter(Boolean).join(' ').trim()
  return n || fallback
}

function firstName(first: string | null, fallback: string) {
  return (first ?? '').trim() || fallback
}

export type PairIntroLead = {
  first_name: string | null
  last_name: string | null
  email: string | null
  ai_summary: string | null
  raw_intent: string | null
  primary_type: string | null
}

export type PairIntroContext = {
  matched_record_type: 'person' | 'opportunity'
  why_this_fits: string | null
  best_next_step: string | null
  /** Person: bio + org + title; opportunity: description + stage */
  counterparty_blurb: string
  counterparty_name: string
  counterparty_email: string | null
}

/** Shared builder for template email and LLM input. */
export function buildPairIntroContext(
  kind: 'person' | 'opportunity',
  displayTitle: string,
  person: {
    title: string | null
    organization: string | null
    bio: string | null
    email: string | null
  } | null,
  opportunity: {
    description: string | null
    stage: string | null
    type: string
    name: string
    contact_email: string | null
  } | null,
  why_this_fits: string,
  best_next_step: string,
): PairIntroContext {
  if (kind === 'person' && person) {
    const blurb =
      [person.title, person.organization, person.bio].filter(Boolean).join(' · ').slice(0, 600) ||
      'Profile on file in Nucleus.'
    return {
      matched_record_type: 'person',
      why_this_fits,
      best_next_step,
      counterparty_blurb: blurb,
      counterparty_name: displayTitle,
      counterparty_email: person.email ?? null,
    }
  }
  const o = opportunity!
  const blurb =
    [o.description, o.stage, o.type].filter(Boolean).join(' · ').slice(0, 600) || o.name
  return {
    matched_record_type: 'opportunity',
    why_this_fits,
    best_next_step,
    counterparty_blurb: blurb,
    counterparty_name: displayTitle,
    counterparty_email: o.contact_email ?? null,
  }
}

export function buildPairIntroEmail(
  lead: PairIntroLead,
  ctx: PairIntroContext,
): string {
  const leadName = safeName(lead.first_name, lead.last_name, 'there')
  const leadFirst = firstName(lead.first_name, leadName.split(' ')[0] ?? 'there')
  const cpParts = ctx.counterparty_name.trim().split(/\s+/)
  const cpFirst = cpParts[0] || 'there'

  const leadOneLiner =
    lead.ai_summary?.trim() ||
    lead.raw_intent?.trim() ||
    '(See their intake notes in Concierge.)'
  const typeLine = lead.primary_type
    ? `Background: ${lead.primary_type.replace(/_/g, ' ')}.`
    : ''

  const cpLine =
    ctx.matched_record_type === 'person'
      ? `About ${ctx.counterparty_name}: ${ctx.counterparty_blurb}`
      : `About ${ctx.counterparty_name} (opportunity): ${ctx.counterparty_blurb}`

  const why = ctx.why_this_fits?.trim() || 'We think there is enough overlap to warrant a conversation.'
  const step = ctx.best_next_step?.trim() ||
    'Suggest a short intro call or async exchange — whatever fits your schedules.'

  return [
    `Hi ${leadFirst} and ${cpFirst},`,
    '',
    `I'm connecting you both through the Nucleus Connections Hub.`,
    '',
    `${leadName} — ${typeLine}`.trim(),
    `${leadOneLiner}`,
    '',
    cpLine,
    '',
    `Why we suggested this introduction:`,
    why,
    '',
    `Suggested next step:`,
    step,
    '',
    `I'll let you two take it from here — feel free to loop the Nucleus team if we can help.`,
    '',
    `— Nucleus Connections Hub`,
  ].join('\n')
}
