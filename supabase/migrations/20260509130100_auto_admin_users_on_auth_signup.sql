-- Self-serve admin signup (interim MVP): anyone who completes Supabase Auth sign-up becomes staff in admin_users.
-- Inserts bypass RLS via SECURITY DEFINER; client still cannot INSERT directly.

create or replace function public.on_auth_signup_grant_admin_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_users (auth_user_id, email, role)
  values (
    new.id,
    coalesce(trim(new.email), ''),
    'admin'
  )
  on conflict on constraint admin_users_auth_user_id_key do nothing;

  return new;
end;
$$;

comment on function public.on_auth_signup_grant_admin_users() is
  'MVP interim: attaches an admin_users row for every auth.users signup.';

drop trigger if exists auth_signup_grant_admin_users on auth.users;

create trigger auth_signup_grant_admin_users
  after insert on auth.users
  for each row
  execute procedure public.on_auth_signup_grant_admin_users();
