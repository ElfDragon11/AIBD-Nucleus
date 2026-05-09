-- Public leads can log introduction / next-step requests; staff reviews in admin.

create table public.introduction_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  match_record_id uuid references public.match_records (id) on delete set null,
  request_kind text not null,
  target_title text not null,
  matched_record_type text,
  matched_record_id uuid,
  status text not null default 'requested',
    created_at timestamptz not null default now(),
  constraint introduction_requests_kind_ck check (
    request_kind in (
      'intro_meeting',
      'program_intro',
      'working_session_intro'
    )
  ),
  constraint introduction_requests_status_ck check (
    status in ('requested', 'in_progress', 'completed', 'cancelled')
  )
);

create index introduction_requests_lead_id_idx on public.introduction_requests using btree (lead_id);
create index introduction_requests_created_at_idx on public.introduction_requests using btree (created_at desc);
create index introduction_requests_status_idx on public.introduction_requests using btree (status);

alter table public.introduction_requests enable row level security;

create policy "introduction_requests_admin_all"
on public.introduction_requests
for all
to authenticated
using (public.is_admin ())
with check (public.is_admin ());

grant select, insert, update, delete on public.introduction_requests to authenticated;

revoke all on public.introduction_requests from anon;

-- ---------------------------------------------------------------------------
create or replace function public.create_introduction_request(
  p_lead_id uuid,
  p_public_session_id uuid,
  p_request_kind text,
  p_target_title text,
  p_match_record_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_mt text;
  v_mid uuid;
begin
  if not exists (
    select 1
    from public.leads l
    where l.id = p_lead_id
      and l.public_session_id = p_public_session_id
  ) then
    raise exception 'invalid lead or session';
  end if;

  if p_request_kind is null
    or p_request_kind not in (
      'intro_meeting',
      'program_intro',
      'working_session_intro'
    ) then
    raise exception 'invalid request_kind';
  end if;

  if p_target_title is null or length(trim(p_target_title)) = 0 then
    raise exception 'target_title required';
  end if;

  if p_match_record_id is not null then
    if not exists (
      select 1
      from public.match_records m
      where m.id = p_match_record_id
        and m.lead_id = p_lead_id
    ) then
      raise exception 'match does not belong to lead';
    end if;

    select m.matched_record_type, m.matched_record_id
    into v_mt, v_mid
    from public.match_records m
    where m.id = p_match_record_id
      and m.lead_id = p_lead_id;
  end if;

  insert into public.introduction_requests (
    lead_id,
    match_record_id,
    request_kind,
    target_title,
    matched_record_type,
    matched_record_id
  )
  values (
    p_lead_id,
    p_match_record_id,
    p_request_kind,
    trim(p_target_title),
    v_mt,
    v_mid
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.create_introduction_request(uuid, uuid, text, text, uuid) is
  'Public: logs an introduction / next-step request for CRM review (session-scoped).';

grant execute on function public.create_introduction_request(uuid, uuid, text, text, uuid) to anon, authenticated;
