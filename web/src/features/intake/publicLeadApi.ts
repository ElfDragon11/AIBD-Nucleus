import { supabase } from '@/lib/supabase'

import type { Database, Json } from '@/lib/database.types'

export type LeadRow = Database['public']['Tables']['leads']['Row']
export type LeadProfileFieldRow =
  Database['public']['Tables']['lead_profile_fields']['Row']
export type IntakeMessageRow =
  Database['public']['Tables']['intake_messages']['Row']

export async function createPublicLead(input: {
  firstName: string
  lastName: string
  email: string
  publicSessionId: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_public_lead', {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_public_session_id: input.publicSessionId,
  })

  if (error) throw error
  if (typeof data !== 'string' || !data) throw new Error('Lead id missing')
  return data
}

export async function fetchLeadForSession(
  leadId: string,
  publicSessionId: string,
): Promise<LeadRow | null> {
  const { data, error } = await supabase.rpc('get_lead_for_session', {
    p_lead_id: leadId,
    p_public_session_id: publicSessionId,
  })
  if (error) throw error
  const row = data?.[0]
  return row ?? null
}

export async function updatePublicLead(params: {
  leadId: string
  publicSessionId: string
  rawIntent?: string | null
  status?: string | null
  primaryType?: string | null
  secondaryTypes?: string[] | null
  aiSummary?: string | null
}): Promise<void> {
  const { leadId, publicSessionId, ...rest } = params
  const { error } = await supabase.rpc('update_public_lead', {
    p_lead_id: leadId,
    p_public_session_id: publicSessionId,
    p_raw_intent: rest.rawIntent,
    p_status: rest.status,
    p_primary_type: rest.primaryType,
    p_secondary_types: rest.secondaryTypes,
    p_ai_summary: rest.aiSummary,
  })
  if (error) throw error
}

export async function appendIntakeMessage(input: {
  leadId: string
  publicSessionId: string
  sender: 'user' | 'assistant' | 'system'
  message: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  const { error } = await supabase.rpc('append_intake_message', {
    p_lead_id: input.leadId,
    p_public_session_id: input.publicSessionId,
    p_sender: input.sender,
    p_message: input.message,
    p_metadata: (input.metadata ?? null) as Json,
  })
  if (error) throw error
}

export async function listIntakeMessages(
  leadId: string,
  publicSessionId: string,
): Promise<IntakeMessageRow[]> {
  const { data, error } = await supabase.rpc(
    'list_intake_messages_for_session',
    {
      p_lead_id: leadId,
      p_public_session_id: publicSessionId,
    },
  )
  if (error) throw error
  return data ?? []
}

export async function listLeadProfileFieldsForSession(
  leadId: string,
  publicSessionId: string,
): Promise<LeadProfileFieldRow[]> {
  const { data, error } = await supabase.rpc(
    'list_lead_profile_fields_for_session',
    {
      p_lead_id: leadId,
      p_public_session_id: publicSessionId,
    },
  )
  if (error) throw error
  return data ?? []
}
