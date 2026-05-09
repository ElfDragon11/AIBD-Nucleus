-- Section 9.1 admin_users — staff profile linked to Supabase Auth (Section 20).
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  constraint admin_users_auth_user_id_key unique (auth_user_id)
);

create index admin_users_auth_user_id_idx on public.admin_users using btree (auth_user_id);

alter table public.admin_users enable row level security;

-- Authenticated admins can read their own row only (expand in Phase 6 if staff need peer visibility).
create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

-- Bootstrap rows via Dashboard SQL or local db reset seed (clients do not INSERT here).

comment on table public.admin_users is 'Nucleus staff; one row per auth.users admin.';
