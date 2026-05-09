import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type LeadRow = {
  id: string
  public_session_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  raw_intent: string | null
  primary_type: string | null
  secondary_types: string[] | null
  status: string
  ai_summary: string | null
  profile_confidence: number | null
}

export async function fetchLeadVerified(
  supabase: SupabaseClient,
  leadId: string,
  publicSessionId: string,
): Promise<LeadRow | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('public_session_id', publicSessionId)
    .maybeSingle()

  if (error || !data) return null
  return data as LeadRow
}
