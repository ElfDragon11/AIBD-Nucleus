import type { IntakeQuestion } from '@/features/intake/intakeQuestion'

export type MockQuestion = IntakeQuestion

const UNSURE = "I'm not sure"

/**
 * Minimal static ladder — swapped for `process-intake-answer` in Phase 4.
 */
export function getMockQuestionsForPrimaryType(primaryType: string): MockQuestion[] {
  switch (primaryType) {
    case 'student_intern':
      return [
        {
          id: 'student_hours',
          fieldTarget: 'availability',
          question: 'How many hours per week can you realistically give right now?',
          options: ['5–10', '10–20', '20+', UNSURE],
        },
        {
          id: 'student_goal',
          fieldTarget: 'needs',
          question: 'What kind of startup experience matters most?',
          options: ['Engineering', 'Growth / BD', 'Product', 'Anything hands-on'],
        },
        {
          id: 'student_comp',
          fieldTarget: 'engagement_preferences',
          question:
            'Are you looking mostly for paid work, internship credit, project experience, or mentorship?',
          options: ['Paid role', 'Internship credit', 'Project-only', UNSURE],
        },
      ]

    case 'operator_executive':
      return [
        {
          id: 'op_role',
          fieldTarget: 'role_interest',
          question: 'What kind of involvement sounds most appealing?',
          options: [
            'Fractional ops / GM',
            'Advisory-only',
            'Board / mentoring',
            UNSURE,
          ],
        },
        {
          id: 'op_stage',
          fieldTarget: 'stage_preferences',
          question:
            'What startup stage feels like the best fit for your experience?',
          options: [
            'Idea → seed',
            'Seed → scaling',
            'No preference yet',
          ],
        },
        {
          id: 'op_geo',
          fieldTarget: 'availability',
          question: 'Are you focused on Utah-based opportunities only?',
          options: ['Yes, Utah-first', 'Open to broader travel', UNSURE],
        },
      ]

    default:
      return [
        {
          id: 'ri_path',
          fieldTarget: 'commercialization_goal',
          question:
            'Are you trying to lead commercialization personally, explore licensing, or just understand market traction first?',
          options: [
            'Personally lead toward a venture',
            'Partner with operators / licensees',
            'Explore market before deciding',
            UNSURE,
          ],
        },
        {
          id: 'ri_ip',
          fieldTarget: 'ip_status',
          question:
            'Is university tech transfer or formal IP filing part of your picture today?',
          options: [
            'University process is underway',
            'Exploring externally',
            'Not yet formal',
            UNSURE,
          ],
        },
        {
          id: 'ri_buyer',
          fieldTarget: 'target_customer',
          question:
            'Do you have a sense who the buyer or end user might eventually be?',
          options: [
            'Hospitals / clinicians',
            'Consumers',
            'Enterprises',
            UNSURE,
          ],
        },
      ]
  }
}

export function normalizeAnswer(selection: string | undefined, notes: string) {
  const parts: string[] = []
  const sel = selection?.trim()
  if (sel) parts.push(sel)
  const n = notes.trim()
  if (n) parts.push(n)
  return parts.join(parts.length === 2 ? '\n\n' : '') || UNSURE
}
