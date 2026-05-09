-- Phase 2: core tables (Section 9), embeddings (9.11), triggers, RLS, session-scoped public RPCs.
-- Requires: extensions.vector from 20260508130500_enable_pgvector.sql
-- pgvector: local/CI must use Supabase Postgres (this project uses major_version 17 with vector).

-- ---------------------------------------------------------------------------
-- 9.2 leads (+ Phase 0 public_session_id)
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  public_session_id uuid not null,
  first_name text,
  last_name text,
  email text,
  organization text,
  source text not null default 'public_intake',
  primary_type text,
  secondary_types text[],
  status text not null default 'intake_started',
  review_status text not null default 'pending',
  ai_summary text,
  raw_intent text,
  profile_confidence numeric,
  bad_fit_risk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_public_session_id_key unique (public_session_id),
  constraint leads_primary_type_ck check (
    primary_type is null
    or primary_type in (
      'researcher_inventor',
      'startup_founder',
      'operator_executive',
      'mentor',
      'subject_matter_expert',
      'investor_venture',
      'service_provider',
      'student_intern'
    )
  )
);

create index leads_email_idx on public.leads using btree (email);
create index leads_status_idx on public.leads using btree (status);
create index leads_created_at_idx on public.leads using btree (created_at desc);

-- ---------------------------------------------------------------------------
-- 9.3 lead_profile_fields
-- ---------------------------------------------------------------------------
create table public.lead_profile_fields (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  field_key text not null,
  field_value jsonb,
  confidence numeric,
  source text not null default 'ai_extracted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_profile_fields_lead_field_key unique (lead_id, field_key)
);

create index lead_profile_fields_lead_id_idx on public.lead_profile_fields using btree (lead_id);

-- ---------------------------------------------------------------------------
-- 9.4 intake_messages
-- ---------------------------------------------------------------------------
create table public.intake_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  sender text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint intake_messages_sender_ck check (
    sender in ('user', 'assistant', 'system')
  )
);

create index intake_messages_lead_id_idx on public.intake_messages using btree (lead_id);
create index intake_messages_lead_id_created_idx on public.intake_messages using btree (lead_id, created_at);

-- ---------------------------------------------------------------------------
-- 9.5 opportunities (+ 9.11 embeddings)
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  organization text,
  sector text[],
  stage text,
  need_types text[],
  status text not null default 'active',
  source text not null default 'manual',
  embedding_text text,
  embedding extensions.vector (1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_type_ck check (
    type in (
      'startup_need',
      'research_project',
      'internship',
      'advisory_need',
      'investor_opportunity',
      'mentorship_need',
      'service_need',
      'program'
    )
  )
);

create index opportunities_type_idx on public.opportunities using btree (type);
create index opportunities_status_idx on public.opportunities using btree (status);

-- ---------------------------------------------------------------------------
-- 9.6 people (+ 9.11 embeddings)
-- ---------------------------------------------------------------------------
create table public.people (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  first_name text,
  last_name text,
  email text,
  organization text,
  title text,
  bio text,
  person_types text[],
  sectors text[],
  skills text[],
  availability text[],
  stage_preferences text[],
  engagement_preferences text[],
  source text not null default 'public_intake',
  status text not null default 'active',
  embedding_text text,
  embedding extensions.vector (1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_lead_id_idx on public.people using btree (lead_id);
create index people_status_idx on public.people using btree (status);

-- ---------------------------------------------------------------------------
-- 9.7 match_records (person XOR opportunity; matched_record_id mirrors FK)
-- ---------------------------------------------------------------------------
create table public.match_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  matched_record_type text not null,
  matched_record_id uuid not null,
  overall_score numeric,
  confidence_label text,
  why_this_fits text,
  best_next_step text,
  potential_gap text,
  score_breakdown jsonb,
  status text not null default 'generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_records_type_ck check (matched_record_type in ('person', 'opportunity')),
  constraint match_records_target_ck check (
    (
      matched_record_type = 'person'
      and person_id is not null
      and opportunity_id is null
      and matched_record_id = person_id
    )
    or (
      matched_record_type = 'opportunity'
      and opportunity_id is not null
      and person_id is null
      and matched_record_id = opportunity_id
    )
  ),
  constraint match_records_status_ck check (
    status in ('generated', 'approved', 'rejected', 'hold', 'intro_drafted', 'synced')
  )
);

create index match_records_lead_id_idx on public.match_records using btree (lead_id);
create index match_records_person_id_idx on public.match_records using btree (person_id);
create index match_records_opportunity_id_idx on public.match_records using btree (opportunity_id);
create index match_records_status_idx on public.match_records using btree (status);

-- ---------------------------------------------------------------------------
-- 9.8 admin_notes
-- ---------------------------------------------------------------------------
create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  admin_user_id uuid references public.admin_users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index admin_notes_lead_id_idx on public.admin_notes using btree (lead_id);
create index admin_notes_admin_user_id_idx on public.admin_notes using btree (admin_user_id);

-- ---------------------------------------------------------------------------
-- 9.9 csv_imports, 9.10 csv_import_rows
-- ---------------------------------------------------------------------------
create table public.csv_imports (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users (id) on delete set null,
  file_name text,
  status text not null default 'uploaded',
  detected_import_type text,
  column_mapping jsonb,
  row_count integer,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index csv_imports_admin_user_id_idx on public.csv_imports using btree (admin_user_id);

create table public.csv_import_rows (
  id uuid primary key default gen_random_uuid(),
  csv_import_id uuid not null references public.csv_imports (id) on delete cascade,
  row_index integer,
  raw_data jsonb,
  mapped_data jsonb,
  status text not null default 'pending',
  error_message text,
  created_record_type text,
  created_record_id uuid,
  created_at timestamptz not null default now()
);

create index csv_import_rows_import_id_idx on public.csv_import_rows using btree (csv_import_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger lead_profile_fields_set_updated_at
before update on public.lead_profile_fields
for each row execute function public.set_updated_at();

create trigger opportunities_set_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger match_records_set_updated_at
before update on public.match_records
for each row execute function public.set_updated_at();

create trigger csv_imports_set_updated_at
before update on public.csv_imports
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin helper (security definer; stable for RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Replace admin_users policies (expand to full staff access pattern)
-- ---------------------------------------------------------------------------
drop policy if exists "admin_users_select_own" on public.admin_users;

create policy "admin_users_select"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "admin_users_insert"
on public.admin_users
for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

create policy "admin_users_update"
on public.admin_users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- RLS: anon has no direct table access — use RPCs below.
-- Authenticated admins: full DML on operational tables.
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.lead_profile_fields enable row level security;
alter table public.intake_messages enable row level security;
alter table public.people enable row level security;
alter table public.opportunities enable row level security;
alter table public.match_records enable row level security;
alter table public.admin_notes enable row level security;
alter table public.csv_imports enable row level security;
alter table public.csv_import_rows enable row level security;

create policy "leads_admin_all"
on public.leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lead_profile_fields_admin_all"
on public.lead_profile_fields
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "intake_messages_admin_all"
on public.intake_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "people_admin_all"
on public.people
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "opportunities_admin_all"
on public.opportunities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "match_records_admin_all"
on public.match_records
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin_notes_admin_all"
on public.admin_notes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "csv_imports_admin_all"
on public.csv_imports
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "csv_import_rows_admin_all"
on public.csv_import_rows
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public intake RPCs (SECURITY DEFINER — validate lead_id + public_session_id)
-- ---------------------------------------------------------------------------
create or replace function public.create_public_lead(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_public_session_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.leads (first_name, last_name, email, public_session_id)
  values (p_first_name, p_last_name, p_email, p_public_session_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.get_lead_for_session(
  p_lead_id uuid,
  p_public_session_id uuid
)
returns setof public.leads
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.leads
  where id = p_lead_id
    and public_session_id = p_public_session_id
  limit 1;
$$;

create or replace function public.update_public_lead(
  p_lead_id uuid,
  p_public_session_id uuid,
  p_raw_intent text default null,
  p_status text default null,
  p_primary_type text default null,
  p_secondary_types text[] default null,
  p_ai_summary text default null,
  p_profile_confidence numeric default null,
  p_bad_fit_risk text default null,
  p_review_status text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leads l
  set
    raw_intent = coalesce(p_raw_intent, l.raw_intent),
    status = coalesce(p_status, l.status),
    primary_type = coalesce(p_primary_type, l.primary_type),
    secondary_types = coalesce(p_secondary_types, l.secondary_types),
    ai_summary = coalesce(p_ai_summary, l.ai_summary),
    profile_confidence = coalesce(p_profile_confidence, l.profile_confidence),
    bad_fit_risk = coalesce(p_bad_fit_risk, l.bad_fit_risk),
    review_status = coalesce(p_review_status, l.review_status),
    first_name = coalesce(p_first_name, l.first_name),
    last_name = coalesce(p_last_name, l.last_name),
    email = coalesce(p_email, l.email)
  where l.id = p_lead_id
    and l.public_session_id = p_public_session_id;
  return found;
end;
$$;

create or replace function public.append_intake_message(
  p_lead_id uuid,
  p_public_session_id uuid,
  p_sender text,
  p_message text,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg_id uuid;
begin
  if not exists (
    select 1
    from public.leads l
    where l.id = p_lead_id
      and l.public_session_id = p_public_session_id
  ) then
    raise exception 'invalid lead or session';
  end if;

  if p_sender is null or p_sender not in ('user', 'assistant', 'system') then
    raise exception 'invalid sender';
  end if;

  insert into public.intake_messages (lead_id, sender, message, metadata)
  values (p_lead_id, p_sender, p_message, p_metadata)
  returning id into v_msg_id;
  return v_msg_id;
end;
$$;

create or replace function public.upsert_lead_profile_field(
  p_lead_id uuid,
  p_public_session_id uuid,
  p_field_key text,
  p_field_value jsonb,
  p_confidence numeric default null,
  p_source text default 'ai_extracted'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1
    from public.leads l
    where l.id = p_lead_id
      and l.public_session_id = p_public_session_id
  ) then
    raise exception 'invalid lead or session';
  end if;

  insert into public.lead_profile_fields (
    lead_id,
    field_key,
    field_value,
    confidence,
    source
  )
  values (
    p_lead_id,
    p_field_key,
    p_field_value,
    p_confidence,
    coalesce(p_source, 'ai_extracted')
  )
  on conflict (lead_id, field_key)
  do update set
    field_value = excluded.field_value,
    confidence = excluded.confidence,
    source = excluded.source,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.list_intake_messages_for_session(
  p_lead_id uuid,
  p_public_session_id uuid
)
returns setof public.intake_messages
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.intake_messages m
  inner join public.leads l on l.id = m.lead_id
  where m.lead_id = p_lead_id
    and l.public_session_id = p_public_session_id
  order by m.created_at asc;
$$;

create or replace function public.list_lead_profile_fields_for_session(
  p_lead_id uuid,
  p_public_session_id uuid
)
returns setof public.lead_profile_fields
language sql
stable
security definer
set search_path = public
as $$
  select f.*
  from public.lead_profile_fields f
  inner join public.leads l on l.id = f.lead_id
  where f.lead_id = p_lead_id
    and l.public_session_id = p_public_session_id
  order by f.field_key asc;
$$;

-- ---------------------------------------------------------------------------
-- Grants: anon uses RPCs only; authenticated uses PostgREST + RLS policies.
-- ---------------------------------------------------------------------------
grant execute on function public.is_admin() to authenticated;

grant execute on function public.create_public_lead(text, text, text, uuid) to anon, authenticated;
grant execute on function public.get_lead_for_session(uuid, uuid) to anon, authenticated;
grant execute on function public.update_public_lead(
  uuid, uuid, text, text, text, text[], text, numeric, text, text, text, text, text
) to anon, authenticated;
grant execute on function public.append_intake_message(uuid, uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.upsert_lead_profile_field(uuid, uuid, text, jsonb, numeric, text) to anon, authenticated;
grant execute on function public.list_intake_messages_for_session(uuid, uuid) to anon, authenticated;
grant execute on function public.list_lead_profile_fields_for_session(uuid, uuid) to anon, authenticated;

grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.lead_profile_fields to authenticated;
grant select, insert, update, delete on public.intake_messages to authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select, insert, update, delete on public.opportunities to authenticated;
grant select, insert, update, delete on public.match_records to authenticated;
grant select, insert, update, delete on public.admin_notes to authenticated;
grant select, insert, update, delete on public.csv_imports to authenticated;
grant select, insert, update, delete on public.csv_import_rows to authenticated;

-- admin_users created in prior migration; ensure API roles can use RLS-gated access.
grant select, insert, update on public.admin_users to authenticated;

comment on function public.create_public_lead is 'Public intake: create lead after identity step; client supplies public_session_id (Phase 0).';
comment on function public.get_lead_for_session is 'Public intake: fetch lead when lead_id and public_session_id match (browser resume).';

-- No direct anon table access (public uses RPCs above).
revoke all on public.leads from anon;
revoke all on public.lead_profile_fields from anon;
revoke all on public.intake_messages from anon;
revoke all on public.people from anon;
revoke all on public.opportunities from anon;
revoke all on public.match_records from anon;
revoke all on public.admin_notes from anon;
revoke all on public.csv_imports from anon;
revoke all on public.csv_import_rows from anon;
revoke all on public.admin_users from anon;
