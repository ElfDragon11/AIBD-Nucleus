import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

/** Prefer publishable (`sb_publishable_…`) when using Supabase newer API keys in dashboard; anon key remains supported. */
const supabasePublishableOrAnon =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

if (
  import.meta.env.DEV &&
  (!supabaseUrl?.trim() || !supabasePublishableOrAnon?.trim())
) {
  console.warn(
    '[Concierge] Set VITE_SUPABASE_URL plus VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY (see web/.env.example)',
  )
}

/** Browser client — publishable / anon key only; keep secret keys server-side only. */
export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabasePublishableOrAnon ?? '',
)
