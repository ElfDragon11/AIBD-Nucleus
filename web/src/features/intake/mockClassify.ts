/**
 * Stub classifier for Phase 3 UI only — replaces `classify-lead` Edge Function later.
 */

export function inferMockPrimaryType(rawIntent: string): string {
  const t = rawIntent.toLowerCase()
  if (/\b(intern|student|byu\b|degree|study(ing)?\b|campus)\b/.test(t))
    return 'student_intern'
  if (/\b(coo|cfo|cto|operations|fractional|part[- ]time|former exec|vp\b)\b/.test(t))
    return 'operator_executive'
  if (/\b(raise|seed|fund|investor|angel|venture|check size)\b/.test(t))
    return 'investor_venture'
  if (
    /\b(startup|founder|saas|raising|customers|company i('m|r) building)\b/.test(t)
  )
    return 'startup_founder'
  return 'researcher_inventor'
}

export function inferMockUnderstanding(input: {
  rawIntent: string
  primaryType: string
}): {
  aiSummary: string
  tags: Record<string, string>
} {
  const { rawIntent, primaryType } = input
  const sector =
    /\b(ai|software|saas|comput)\b/i.test(rawIntent)
      ? 'Software / AI'
      : /\b(life\b|bio|bio|clinical|fda|health)\b/i.test(rawIntent)
        ? 'Life sciences'
        : /\b(energy|battery|climate)\b/i.test(rawIntent)
          ? 'Energy / climate tech'
          : /\b(advanced manufacturing|manufactur)\b/i.test(rawIntent)
            ? 'Advanced manufacturing'
            : 'Utah ecosystem fit TBD'

  const tags: Record<string, string> = {
    Sector: sector,
    Stage: inferStage(rawIntent),
    Needs: inferNeeds(primaryType),
    'Possible next step': inferNext(primaryType),
  }

  const aiSummary =
    primaryType === 'student_intern'
      ? 'Someone early in career looking for structured startup exposure and mentorship.'
      : primaryType === 'operator_executive'
        ? 'An experienced leader open to fractional or advisory help with startups.'
        : primaryType === 'researcher_inventor'
          ? 'A technically strong profile that may be commercially early—inform next steps gently.'
          : 'We will refine this once you answer one or two tailored questions.'

  return {
    aiSummary,
    tags,
  }
}

function inferStage(raw: string): string {
  if (/\b(lab|prototype|validated|discovery)\b/i.test(raw)) return 'Early / lab validated'
  if (/\b(pilot|revenue|seed|scaling)\b/i.test(raw))
    return 'Active company / traction'
  if (/\b(student|intern)\b/i.test(raw)) return 'Education / exploratory'
  return 'Exploring'
}

function inferNeeds(primaryType: string): string {
  if (primaryType === 'researcher_inventor')
    return 'Market clarity, pathways, introductions'
  if (primaryType === 'startup_founder') return 'Operator help, mentorship, traction'
  if (primaryType === 'operator_executive')
    return 'Founder introductions, fractional roles'
  if (primaryType === 'student_intern')
    return 'Projects, mentorship, internship fit'
  if (/\binvestor\b/i.test(primaryType))
    return 'Curated introductions, diligence support'
  return 'Guided next introductions'
}

function inferNext(primaryType: string): string {
  if (primaryType === 'researcher_inventor')
    return 'Commercialization-minded mentor'
  if (primaryType === 'startup_founder')
    return 'Operator or seasoned advisor'
  if (primaryType === 'student_intern')
    return 'Hands-on internship or mentor'
  return 'Thoughtful introductions after a short refinement'
}
