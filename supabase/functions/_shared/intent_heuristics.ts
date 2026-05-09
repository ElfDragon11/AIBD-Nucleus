import type { CanonicalLeadType } from './lead_constants.ts'

/**
 * When the classifier LLM is unavailable or returns no primary type, infer a
 * canonical slug from open-ended intent (mirrors the web mock classifier).
 */
export function inferPrimaryFromIntentText(raw: string): CanonicalLeadType | null {
  const t = raw.toLowerCase()
  if (/\b(intern|student|byu\b|degree|studying\b|campus)\b/.test(t))
    return 'student_intern'
  if (
    /\b(?:am\s+an?\s+executive|an?\s+executive\b|coo|cfo|cto|c[-\s]?suite|\bceo\b|\bpresident\b|\bvp\b|vice\s+president|c[-\s]level\b|fractional|chief\b|former\s+exec|\bhead\s+of\b|opportunit(?:y|ies)\s+to\s+help\b|oppurtunit(?:y|ies)\s+to\s+help\b|(?:help|support)\s+(?:startup|teams?)\b)/.test(t)
  )
    return 'operator_executive'
  if (/\b(raise|seed|fund|investor|angel|venture|check size)\b/.test(t))
    return 'investor_venture'
  if (/\b(startup|founder|saas|raising|customers|company i('m|r) building)\b/.test(t))
    return 'startup_founder'
  if (/\b(mentor|mentorship|advise founders|office hours for founders)\b/.test(t))
    return 'mentor'
  if (/\b(sme|subject matter|domain expert|technical diligence)\b/.test(t))
    return 'subject_matter_expert'
  if (/\b(consult|consulting|agency|legal|accounting|service provider)\b/.test(t))
    return 'service_provider'
  if (
    /\b(professor|phd|lab|patent|tech transfer|spin-?out|research|invent)\b/.test(t)
  )
    return 'researcher_inventor'
  return null
}
