import { callOpenAiText } from './llm.ts'
import {
  buildPairIntroEmail,
  buildPairIntroContext,
  type PairIntroContext,
  type PairIntroLead,
} from './pair_intro_email.ts'

const SYSTEM = `You draft mutual introduction emails for "Nucleus Connections Hub".
The facilitator (Nucleus) is introducing two parties who have not met: an intake lead and a matched person or startup opportunity.

Rules:
- Warm, human tone — not a rigid template or bullet homework list.
- Address both recipients naturally (use first names when provided; avoid "Party A / Party B").
- Weave in why the match makes sense without sounding like a marketing mail merge.
- End with a light nudge toward a concrete next step (call, async exchange, or intro to an advisor) — one sentence is enough.
- Optionally sign off as "— Nucleus Connections Hub" on its own line at the end (no subject line).
- Plain text only. No markdown, no JSON.
- Do not invent facts, companies, or credentials not present in the context.`

export async function generatePairIntroEmailLlm(
  lead: PairIntroLead,
  ctx: PairIntroContext,
): Promise<string | null> {
  const payload = {
    lead: {
      first_name: lead.first_name,
      last_name: lead.last_name,
      primary_type: lead.primary_type,
      ai_summary: lead.ai_summary,
      raw_intent: lead.raw_intent,
    },
    counterparty: {
      type: ctx.matched_record_type,
      name: ctx.counterparty_name,
      context: ctx.counterparty_blurb,
      email_on_file: ctx.counterparty_email,
    },
    nucleus_assessment: {
      why_this_fits: ctx.why_this_fits,
      suggested_next_step: ctx.best_next_step,
    },
  }

  const result = await callOpenAiText(
    [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `Write one introduction email body (plain text) from this structured context:\n\n${
          JSON.stringify(payload, null, 2)
        }`,
      },
    ],
    { temperature: 0.7, max_tokens: 1400 },
  )

  if (!result.ok) {
    console.error('generatePairIntroEmailLlm:', result.error)
    return null
  }
  const t = result.text.trim()
  if (t.length < 80) return null
  return t
}

export async function introEmailDraftWithLlmFallback(
  lead: PairIntroLead,
  args: {
    kind: 'person' | 'opportunity'
    displayTitle: string
    person: {
      title: string | null
      organization: string | null
      bio: string | null
      email: string | null
    } | null
    opportunity: {
      description: string | null
      stage: string | null
      type: string
      name: string
      contact_email: string | null
    } | null
    why_this_fits: string
    best_next_step: string
  },
): Promise<{ text: string; source: 'llm' | 'template' }> {
  const ctx = buildPairIntroContext(
    args.kind,
    args.displayTitle,
    args.person,
    args.opportunity,
    args.why_this_fits,
    args.best_next_step,
  )
  const llm = await generatePairIntroEmailLlm(lead, ctx)
  if (llm) return { text: llm, source: 'llm' }
  return { text: buildPairIntroEmail(lead, ctx), source: 'template' }
}
