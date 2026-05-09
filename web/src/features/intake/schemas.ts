import { z } from 'zod'

export const identitySchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(120, 'Too long'),
  last_name: z.string().min(1, 'Last name is required').max(120, 'Too long'),
  email: z.string().email('Enter a valid email').max(320, 'Too long'),
})

export type IdentityFormValues = z.infer<typeof identitySchema>

export const intentSchema = z.object({
  raw_intent: z
    .string()
    .min(8, 'A few sentences help us tailor next steps.')
    .max(8000, 'Too long'),
})

export type IntentFormValues = z.infer<typeof intentSchema>
