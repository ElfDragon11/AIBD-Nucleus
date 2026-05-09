import { z } from 'npm:zod@3.23.8'

export const nextQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).max(8),
  allow_free_response: z.boolean(),
  allow_unsure: z.boolean(),
  field_target: z.string().min(1),
})

export type NextQuestion = z.infer<typeof nextQuestionSchema>

export const classifyLlmSchema = z.object({
  primary_type: z.string().nullable(),
  secondary_types: z.array(z.string()).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  sector_guess: z.string().nullable().optional(),
  stage_guess: z.string().nullable().optional(),
  intent_guess: z.string().nullable().optional(),
  suggested_tags: z.array(z.string()).nullable().optional(),
  first_followup_question: z
    .object({
      question: z.string(),
      options: z.array(z.string()),
      allow_free_response: z.boolean().optional(),
      allow_unsure: z.boolean().optional(),
      field_target: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export type ClassifyLlmOut = z.infer<typeof classifyLlmSchema>

export const processIntakeLlmSchema = z.object({
  profile_fields: z.record(z.unknown()).nullable().optional(),
  confidence_by_field: z.record(z.number()).nullable().optional(),
  profile_summary: z.string().nullable().optional(),
  missing_fields: z.array(z.string()).nullable().optional(),
  should_show_recommendations: z.boolean().optional(),
  next_question: z
    .object({
      question: z.string(),
      options: z.array(z.string()),
      allow_free_response: z.boolean().optional(),
      allow_unsure: z.boolean().optional(),
      field_target: z.string().optional(),
    })
    .nullable()
    .optional(),
  bad_fit_risk: z.enum(['low', 'medium', 'high']).nullable().optional(),
})

export type ProcessIntakeLlmOut = z.infer<typeof processIntakeLlmSchema>
