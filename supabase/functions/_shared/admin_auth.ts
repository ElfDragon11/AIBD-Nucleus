import { createClient } from 'jsr:@supabase/supabase-js@2'

import { createServiceClient } from './supabase_admin.ts'

export type AdminAuthOk = {
  ok: true
  authUserId: string
  adminUserId: string
}

export type AdminAuthErr = {
  ok: false
  status: number
  message: string
}

export async function verifyAdminFromRequest(
  req: Request,
): Promise<AdminAuthOk | AdminAuthErr> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Missing authorization' }
  }
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) {
    return { ok: false, status: 500, message: 'Server misconfigured' }
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) {
    return { ok: false, status: 401, message: 'Invalid session' }
  }

  const service = createServiceClient()
  const { data: adminRow, error: adminErr } = await service
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (adminErr || !adminRow) {
    return { ok: false, status: 403, message: 'Not an admin' }
  }

  return {
    ok: true,
    authUserId: user.id,
    adminUserId: adminRow.id as string,
  }
}
