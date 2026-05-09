export type MatchCardItem = {
  title: string
  matchKind: string
  whyThisFits: string
  bestNextStep: string
  confidenceLabel: 'High' | 'Medium-high' | 'Medium' | 'Exploratory'
  potentialGap?: string | null
  iconKind?: 'mentor' | 'operator' | 'program'
  /** Present when this card came from `match_records` (CRM-linked request). */
  matchRecordId?: string | null
}

/** @deprecated use MatchCardItem */
export type MockRecommendation = MatchCardItem

/** Static cards for tests / storybook. */
export function getMockRecommendationCards(
  primaryTypeSlug: string | null,
): MockRecommendation[] {
  const p = primaryTypeSlug ?? 'researcher_inventor'
  switch (p) {
    case 'student_intern':
      return [
        {
          title: 'AI product internship cohort',
          matchKind: 'Opportunity · internship',
          whyThisFits:
            'A founder-led SaaS squad that loves pairing student engineers with ambiguous customer-facing problems—you said you prefer hands-on work.',
          bestNextStep:
            'Request a lightweight portfolio review plus a scoped two-week spike.',
          confidenceLabel: 'High',
          potentialGap:
            'If you cannot commit consistent weekly hours they may prioritize another candidate.',
          iconKind: 'program',
        },
        {
          title: 'BYU-affiliated mentorship desk',
          matchKind: 'Mentorship · concierge',
          whyThisFits:
            'You are still narrowing focus; mentorship first keeps risk low before locking an internship.',
          bestNextStep:
            'Book one 45-minute mentorship session with a topical note attached.',
          confidenceLabel: 'Medium-high',
          potentialGap:
            'Mentorship is conversational—it is not guaranteed project placement.',
          iconKind: 'mentor',
        },
        {
          title: 'Customer discovery micro-project',
          matchKind: 'Program · experiential',
          whyThisFits:
            'If you crave proof of hustle, scoped discovery sprint teams often slot students faster than full hires.',
          bestNextStep:
            'Ask for a templated outreach pack plus one recorded customer summary.',
          confidenceLabel: 'Medium',
          potentialGap:
            'Compensation varies by host company—confirm expectations before starting.',
          iconKind: 'program',
        },
      ]

    case 'operator_executive':
      return [
        {
          title: 'Advanced manufacturing scale-up operator',
          matchKind: 'Founder asks · fractional ops',
          whyThisFits:
            'The CEO is struggling with repeatable supply chain onboarding—precisely the muscle you hinted at owning.',
          bestNextStep:
            'Offer a gratis 45-minute bottleneck mapping working session.',
          confidenceLabel: 'High',
          potentialGap:
            'They may ultimately need onsite presence more than fractional remote.',
          iconKind: 'operator',
        },
        {
          title: 'University spinout commercialization steward',
          matchKind: 'Opportunity · governing board',
          whyThisFits:
            'Licensing-heavy teams often want an operator sherpa—not another researcher deck.',
          bestNextStep: 'Volunteer monthly office hours contingent on milestones.',
          confidenceLabel: 'Medium-high',
          potentialGap:
            'University timelines crawl; stamina for politics matters.',
          iconKind: 'mentor',
        },
        {
          title: 'Climate hardware pilot program advisor',
          matchKind: 'Program · fractional',
          whyThisFits:
            'If you signaled comfort with ambiguity, advising two pilot cohorts showcases expertise without committing full-time.',
          bestNextStep:
            'Draft a concise “how I engage” checklist for founders.',
          confidenceLabel: 'Exploratory',
          potentialGap:
            'Funding for stipends remains uncertain this quarter.',
          iconKind: 'program',
        },
      ]

    default:
      return [
        {
          title: 'Commercialization mentor pairing',
          matchKind: 'Mentor · first conversation',
          whyThisFits:
            'Technically credible but commercially early—we want someone who slows you down in the healthiest ways before staffing up.',
          bestNextStep:
            'Secure a humble “what-not-to-do-yet” review before hiring.',
          confidenceLabel: 'High',
          potentialGap:
            'Likely advisory depth first—not full-time interim leadership.',
          iconKind: 'mentor',
        },
        {
          title: 'Regulatory-informed diligence circle',
          matchKind: 'Subject-matter expert',
          whyThisFits:
            'If your solution touches clinicians and compliance, threading regulatory nuance saves months later.',
          bestNextStep:
            'Share anonymized workflows for a directional read—not legal advice.',
          confidenceLabel: 'Medium-high',
          potentialGap:
            'Experts seldom replace formal counsel—they guide questions.',
          iconKind: 'mentor',
        },
        {
          title: 'Student discovery squad',
          matchKind: 'Program · customer insight',
          whyThisFits:
            'Cheap, energized teams can stress-test hypotheses while you clarify founder intent.',
          bestNextStep: 'Prototype a painfully specific interview guide together.',
          confidenceLabel: 'Medium',
          potentialGap:
            'Momentum depends on mentors staying engaged between sprints.',
          iconKind: 'program',
        },
        {
          title: 'Later: fractional chief business officer archetype',
          matchKind: 'Operator · exploratory',
          whyThisFits:
            'If you insist on owning company creation, tuck this card away until milestones prove demand.',
          bestNextStep:
            'Revisit once you summarize three repeatable customer hypotheses.',
          confidenceLabel: 'Exploratory',
          potentialGap:
            'Probably premature unless revenue signals tighten.',
          iconKind: 'operator',
        },
      ]
  }
}

function normalizeConfidence(
  raw: string | null | undefined,
): MatchCardItem['confidenceLabel'] {
  const s = (raw ?? '').trim()
  if (
    s === 'High' ||
    s === 'Medium-high' ||
    s === 'Medium' ||
    s === 'Exploratory'
  ) {
    return s
  }
  return 'Medium'
}

/** Map `list_match_records_for_session` row → card props. */
export function matchRpcRowToCard(input: {
  match_id: string
  card_title: string
  match_kind_label: string
  why_this_fits: string | null
  best_next_step: string | null
  confidence_label: string | null
  potential_gap: string | null
  icon_kind: string
}): MatchCardItem {
  const icon = input.icon_kind?.trim()
  let iconKind: MatchCardItem['iconKind']
  if (icon === 'operator' || icon === 'program' || icon === 'mentor') {
    iconKind = icon
  }

  return {
    matchRecordId: input.match_id,
    title: input.card_title,
    matchKind: input.match_kind_label,
    whyThisFits: input.why_this_fits ?? '',
    bestNextStep: input.best_next_step ?? '',
    confidenceLabel: normalizeConfidence(input.confidence_label),
    potentialGap: input.potential_gap,
    iconKind,
  }
}
