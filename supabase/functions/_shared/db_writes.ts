import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export async function upsertProfileFieldRow(
  supabase: SupabaseClient,
  leadId: string,
  fieldKey: string,
  fieldValue: unknown,
  confidence: number | null,
): Promise<void> {
  const { error } = await supabase.from('lead_profile_fields').upsert(
    {
      lead_id: leadId,
      field_key: fieldKey,
      field_value:
        fieldValue as string | number | boolean | Record<string, unknown> | null,
      confidence,
      source: 'ai_extracted',
    },
    { onConflict: 'lead_id,field_key' },
  )
  if (error) throw error
}

export async function appendMessage(
  supabase: SupabaseClient,
  leadId: string,
  sender: 'user' | 'assistant' | 'system',
  message: string,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await supabase.from('intake_messages').insert({
    lead_id: leadId,
    sender,
    message,
    metadata,
  })
  if (error) throw error
}
