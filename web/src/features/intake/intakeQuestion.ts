/** Shared UI shape for adaptive questions (AI or local mock ladder). */
export type IntakeQuestion = {
  id: string
  question: string
  options: string[]
  /** Future extraction routing */
  fieldTarget?: string
}
