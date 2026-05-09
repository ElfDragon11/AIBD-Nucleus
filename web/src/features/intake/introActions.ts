import type { MatchCardItem } from '@/features/intake/mockRecommendations'

/** Logged to CRM / `introduction_requests.request_kind` */
export type IntroRequestKind =
  | 'intro_meeting'
  | 'program_intro'
  | 'working_session_intro'

/** Maps card shape → stored request kind (aligns with best next step tone). */
export function deriveIntroRequestKind(item: MatchCardItem): IntroRequestKind {
  const mk = item.matchKind.toLowerCase()
  if (
    item.iconKind === 'program' ||
    /\b(program|internship|cohort|studio|squad)\b/i.test(mk) ||
    /\b(internship)\b/i.test(item.title)
  ) {
    return 'program_intro'
  }
  if (
    item.iconKind === 'operator' ||
    /\b(fractional|operator|ops|working session|scoping|bottleneck)\b/i.test(mk) ||
    /\b(fractional|operations|supply chain|ops)\b/i.test(item.title)
  ) {
    return 'working_session_intro'
  }
  return 'intro_meeting'
}

export function introRequestButtonLabel(kind: IntroRequestKind): string {
  switch (kind) {
    case 'program_intro':
      return 'Request program introduction'
    case 'working_session_intro':
      return 'Request intro & scoping call'
    default:
      return 'Request introduction & meeting'
  }
}

export function introRequestKindLabel(kind: string): string {
  switch (kind) {
    case 'program_intro':
      return 'Program / cohort introduction'
    case 'working_session_intro':
      return 'Intro + working session'
    case 'intro_meeting':
      return 'Introduction + meeting'
    default:
      return kind
  }
}
