import {
  CANONICAL_LEAD_TYPES,
  type CanonicalLeadType,
} from './lead_constants.ts'
import type { NextQuestion } from './schemas.ts'

const UNSURE = "I'm not sure"

export type FallbackTemplate = Omit<NextQuestion, 'question'> & {
  question: string
}

/** Static ladders when LLM unavailable — keyed by canonical primary_type */
export const FALLBACK_QUESTIONS: Record<
  CanonicalLeadType,
  FallbackTemplate[]
> = {
  researcher_inventor: [
    {
      question:
        'Are you trying to lead commercialization personally, explore licensing, or understand market traction first?',
      options: [
        'Personally lead toward a venture',
        'Partner with operators / licensees',
        'Explore market before deciding',
        UNSURE,
      ],
      field_target: 'commercialization_goal',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question:
        'Is university tech transfer or formal IP filing part of your picture today?',
      options: [
        'University process is underway',
        'Exploring externally',
        'Not yet formal',
        UNSURE,
      ],
      field_target: 'ip_status',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question:
        'Do you have a sense who the buyer or end user might eventually be?',
      options: ['Healthcare / clinicians', 'Consumers', 'Industrial / B2B', UNSURE],
      field_target: 'target_customer',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  startup_founder: [
    {
      question: 'What stage is the company closest to today?',
      options: ['Idea', 'Early product', 'Growth / traction', UNSURE],
      field_target: 'stage',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'What is the biggest bottleneck you are navigating right now?',
      options: [
        'Product / technical',
        'Sales / traction',
        'Fundraising',
        UNSURE,
      ],
      field_target: 'needs',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'Which sector describes you best?',
      options: ['Software', 'Healthcare', 'Climate / industrials', 'Other'],
      field_target: 'sector',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  operator_executive: [
    {
      question: 'What kind of involvement sounds most appealing?',
      options: [
        'Fractional ops / GM',
        'Advisory-only',
        'Board / mentoring',
        UNSURE,
      ],
      field_target: 'role_interest',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question:
        'What startup stage feels like the best fit for your experience?',
      options: ['Idea → seed', 'Seed → scaling', 'No preference yet'],
      field_target: 'stage_preferences',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'Are you focused on Utah-based opportunities only?',
      options: ['Yes, Utah-first', 'Open to broader travel', UNSURE],
      field_target: 'availability',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  mentor: [
    {
      question:
        'What style of mentorship are you hoping to offer?',
      options: [
        'One-off calls',
        'Ongoing light touch',
        'Deeper engagements',
        UNSURE,
      ],
      field_target: 'availability',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'Which founders or teams do you prefer to support?',
      options: ['First-time founders', 'Technical teams', 'No preference'],
      field_target: 'needs',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  subject_matter_expert: [
    {
      question: 'What domains best describe where you answer hard questions?',
      options: ['Regulatory', 'Clinical / science', 'Go-to-market', 'Other'],
      field_target: 'expertise',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question:
        'What types of engagements are you open to?',
      options: ['One-time diligence', 'Advisory', 'Workshops', UNSURE],
      field_target: 'engagement_preferences',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  investor_venture: [
    {
      question: 'Which investment stage is the best fit for you?',
      options: ['Pre-seed / seed', 'Series A+', 'Multiple stages', UNSURE],
      field_target: 'stage',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'Do you have sector themes you care about most?',
      options: ['Software', 'Healthcare', 'Climate / industrials', 'Generalist'],
      field_target: 'sector',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  service_provider: [
    {
      question:
        'What kind of startup-facing help do you provide?',
      options: ['Legal', 'Finance / CFO', 'GTM', 'Talent', UNSURE],
      field_target: 'needs',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'Do you prefer early-stage or growth-stage teams?',
      options: ['Early', 'Growth', 'Either'],
      field_target: 'stage_preferences',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
  student_intern: [
    {
      question: 'How many hours per week can you realistically give right now?',
      options: ['5–10', '10–20', '20+', UNSURE],
      field_target: 'availability',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question: 'What kind of startup experience matters most?',
      options: ['Engineering', 'Growth / BD', 'Product', 'Anything hands-on'],
      field_target: 'needs',
      allow_free_response: true,
      allow_unsure: true,
    },
    {
      question:
        'Are you looking mostly for paid work, internship credit, project experience, or mentorship?',
      options: ['Paid role', 'Internship credit', 'Project-only', UNSURE],
      field_target: 'engagement_preferences',
      allow_free_response: true,
      allow_unsure: true,
    },
  ],
}

export function normalizePrimaryType(
  raw: string | null | undefined,
): CanonicalLeadType | null {
  if (!raw) return null
  const s = raw.trim()
  if ((CANONICAL_LEAD_TYPES as readonly string[]).includes(s)) {
    return s as CanonicalLeadType
  }
  return null
}

export function pickFallbackQuestion(
  primary: CanonicalLeadType | null,
  filledFieldKeys: Set<string>,
): NextQuestion | null {
  const key = primary ?? 'researcher_inventor'
  const list = FALLBACK_QUESTIONS[key] ?? FALLBACK_QUESTIONS.researcher_inventor

  const candidates = list.filter((q) => !filledFieldKeys.has(q.field_target))
  if (candidates.length === 0) {
    return null
  }
  const picked = candidates[0]

  let options = [...picked.options]
  if (picked.allow_unsure && !options.includes(UNSURE)) {
    options = [...options, UNSURE]
  }

  return {
    question: picked.question,
    options: options.slice(0, 8),
    allow_free_response: picked.allow_free_response ?? true,
    allow_unsure: picked.allow_unsure ?? true,
    field_target: picked.field_target,
  }
}
