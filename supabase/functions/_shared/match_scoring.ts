import { cosineSimilarity } from './embeddings.ts'
import type { CanonicalLeadType } from './lead_constants.ts'

export type PersonRow = {
  id: string
  person_types: string[] | null
  sectors: string[] | null
  skills: string[] | null
  availability: string[] | null
  stage_preferences: string[] | null
  engagement_preferences: string[] | null
  bio: string | null
  embedding_text: string | null
}

export type OpportunityRow = {
  id: string
  type: string
  sector: string[] | null
  stage: string | null
  need_types: string[] | null
  description: string | null
  embedding_text: string | null
}

export type LeadSignals = {
  leadType: CanonicalLeadType
  /** Lower text: intent + summary + stringified profile hints */
  blob: string
}

function overlapScore(a: string[] | null, b: string[] | null): number {
  if (!a?.length || !b?.length) return 0
  const setB = new Set(b.map((x) => x.toLowerCase()))
  let n = 0
  for (const x of a) {
    if (setB.has(x.toLowerCase())) n++
  }
  return n / Math.max(a.length, 1)
}

function utahBonus(blob: string): number {
  return /\butah\b|salt lake|provo|mountain west|wasatch/i.test(blob) ? 8 : 0
}

export function scorePerson(
  lead: LeadSignals,
  p: PersonRow,
  vectorSim: number,
): { overall: number; breakdown: Record<string, number> } {
  const sector = overlapScore(p.sectors, extractSectorHints(lead.blob)) * 22
  const typeFit = 18
  const stage = overlapScore(p.stage_preferences, extractStageHints(lead.blob)) * 15
  const vec = Math.max(0, Math.min(1, vectorSim)) * 28
  const ut = utahBonus(lead.blob)
  const overall = Math.min(
    100,
    Math.round(sector + typeFit * 0.5 + stage + vec + ut),
  )
  return {
    overall,
    breakdown: {
      sector_overlap: Math.round(sector),
      stage_overlap: Math.round(stage),
      vector_similarity: Math.round(vec),
      type_fit_base: typeFit,
      utah_relevance: ut,
    },
  }
}

export function scoreOpportunity(
  lead: LeadSignals,
  o: OpportunityRow,
  vectorSim: number,
): { overall: number; breakdown: Record<string, number> } {
  const sector = overlapScore(o.sector, extractSectorHints(lead.blob)) * 24
  const need = overlapScore(o.need_types, extractNeedHints(lead.leadType, lead.blob)) * 22
  const vec = Math.max(0, Math.min(1, vectorSim)) * 30
  const ut = utahBonus(lead.blob)
  const overall = Math.min(100, Math.round(sector + need + vec + ut))
  return {
    overall,
    breakdown: {
      sector_overlap: Math.round(sector),
      need_overlap: Math.round(need),
      vector_similarity: Math.round(vec),
      utah_relevance: ut,
    },
  }
}

function extractSectorHints(blob: string): string[] {
  const out: string[] = []
  const keys = [
    'life_sciences',
    'diagnostics',
    'software',
    'hardware',
    'manufacturing',
    'industrial',
    'b2b',
    'healthcare',
    'deeptech',
    'energy',
  ]
  const low = blob.toLowerCase()
  for (const k of keys) {
    if (low.includes(k.replace('_', ' ')) || low.includes(k)) out.push(k)
  }
  if (/saas|software|ai\b/i.test(blob)) out.push('software')
  if (/lab|diagnostic|medical|clinical|health/i.test(blob)) {
    out.push('life_sciences')
    out.push('diagnostics')
  }
  return [...new Set(out)]
}

function extractStageHints(blob: string): string[] {
  const low = blob.toLowerCase()
  const s: string[] = []
  if (/pre-?seed|early|idea/i.test(blob)) s.push('pre_seed', 'lab_validated')
  if (/seed\b/i.test(blob)) s.push('seed')
  if (/series a/i.test(blob)) s.push('series_a')
  if (/lab|university|professor|pi\b/i.test(blob)) s.push('lab_validated')
  return s
}

function extractNeedHints(
  lt: CanonicalLeadType,
  blob: string,
): string[] {
  const low = blob.toLowerCase()
  const n: string[] = []
  if (/mentor|advis/i.test(blob)) n.push('mentorship')
  if (/operat|fractional|coo|supply/i.test(blob)) n.push('operator', 'fractional')
  if (/invest|raise|fund/i.test(blob)) n.push('investor_intros')
  if (/student|intern/i.test(blob)) n.push('students')
  if (/legal|incorporat/i.test(blob)) n.push('legal')
  if (lt === 'researcher_inventor') n.push('mentorship', 'regulatory')
  if (lt === 'startup_founder') n.push('operator', 'fundraising')
  return n
}
