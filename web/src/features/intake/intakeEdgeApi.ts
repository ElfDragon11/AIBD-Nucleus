import type {
  ClassifyLeadBody,
  ClassifyLeadResult,
  ProcessIntakeAnswerBody,
  ProcessIntakeAnswerResult,
} from '@/features/intake/intakeEdgeContracts'
import { supabase } from '@/lib/supabase'

function unwrapFnError(prefix: string, err: unknown): Error {
  if (err instanceof Error && err.message) {
    return new Error(`${prefix}: ${err.message}`)
  }
  return new Error(`${prefix}: unknown error`)
}

export async function classifyLeadEdge(
  input: ClassifyLeadBody,
): Promise<ClassifyLeadResult> {
  const { data, error } = await supabase.functions.invoke<ClassifyLeadResult>(
    'classify-lead',
    { body: input },
  )
  if (error) throw unwrapFnError('classify-lead', error)

  const r = data
  if (!r?.primary_type || !r?.next_question?.question) {
    throw new Error('classify-lead returned an invalid payload')
  }
  return r
}

export async function processIntakeAnswerEdge(
  input: ProcessIntakeAnswerBody,
): Promise<ProcessIntakeAnswerResult> {
  const { data, error } =
    await supabase.functions.invoke<ProcessIntakeAnswerResult>(
      'process-intake-answer',
      { body: input },
    )
  if (error) throw unwrapFnError('process-intake-answer', error)
  const r = data
  if (!r || typeof r.should_show_recommendations !== 'boolean') {
    throw new Error('process-intake-answer returned an invalid payload')
  }
  return r
}
