-- Phase 5: matching — public session RPC for match cards, keyword retrieval helpers.
-- Vector similarity runs in the find-matches Edge Function (small inventory) using
-- embedding columns from people / opportunities.

-- ---------------------------------------------------------------------------
-- Public: list match rows for browser reveal (session-scoped)
-- ---------------------------------------------------------------------------
create or replace function public.list_match_records_for_session(
  p_lead_id uuid,
  p_public_session_id uuid
)
returns table (
  match_id uuid,
  matched_record_type text,
  overall_score numeric,
  confidence_label text,
  why_this_fits text,
  best_next_step text,
  potential_gap text,
  score_breakdown jsonb,
  card_title text,
  match_kind_label text,
  icon_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.matched_record_type,
    m.overall_score,
    m.confidence_label,
    m.why_this_fits,
    m.best_next_step,
    m.potential_gap,
    m.score_breakdown,
    case
      when m.matched_record_type = 'person' then
        coalesce(
          nullif(trim(concat_ws(' ', pe.first_name, pe.last_name)), ''),
          pe.title,
          pe.organization,
          'Community member'
        )
      else o.name
    end as card_title,
    case
      when m.matched_record_type = 'person' then
        'Person · ' || coalesce(array_to_string(pe.person_types, ', '), 'intro')
      else 'Opportunity · ' || coalesce(o.type, 'match')
    end as match_kind_label,
    case
      when m.matched_record_type = 'opportunity' then
        case
          when o.type in ('program', 'internship') then 'program'
          when o.type = 'advisory_need'
            and (o.need_types && array['operator', 'fractional']::text[]) then 'operator'
          when o.type in ('startup_need', 'service_need', 'mentorship_need', 'research_project')
            and (o.need_types && array['operator', 'fractional']::text[]) then 'operator'
          else 'mentor'
        end
      else
        case
          when pe.person_types && array['operator', 'executive']::text[] then 'operator'
          when pe.person_types && array['student', 'researcher']::text[]
            and not (pe.person_types && array['operator', 'executive']::text[]) then 'program'
          else 'mentor'
        end
    end::text as icon_kind
  from public.match_records m
  inner join public.leads l on l.id = m.lead_id
  left join public.people pe on m.person_id = pe.id
  left join public.opportunities o on m.opportunity_id = o.id
  where m.lead_id = p_lead_id
    and l.public_session_id = p_public_session_id
  order by m.overall_score desc nulls last, m.created_at asc;
$$;

comment on function public.list_match_records_for_session(uuid, uuid) is
  'Public recommendations page: match rows + titles for the owning public_session_id.';

grant execute on function public.list_match_records_for_session(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Keyword retrieval — used when embeddings are missing or as hybrid signal
-- ---------------------------------------------------------------------------
create or replace function public.keyword_search_people(
  p_query text,
  p_limit integer
)
returns table (
  id uuid,
  kw_rank real
)
language plpgsql
stable
as $$
declare
  q text := trim(coalesce(p_query, ''));
  lim int := greatest(1, least(coalesce(p_limit, 40), 200));
  tsq tsquery;
begin
  if q = '' then
    return;
  end if;

  tsq := websearch_to_tsquery('english', q);
  if tsq is null or tsq = ''::tsquery then
    tsq := plainto_tsquery('english', q);
  end if;

  return query
  with base as (
    select
      p.id,
      (
        coalesce(p.embedding_text, '') || ' ' || coalesce(p.bio, '') || ' ' ||
        coalesce(array_to_string(p.sectors, ' '), '') || ' ' ||
        coalesce(array_to_string(p.skills, ' '), '') || ' ' ||
        coalesce(array_to_string(p.person_types, ' '), '')
      ) as blob
    from public.people p
    where p.status = 'active'
  ),
  scored as (
    select
      b.id,
      greatest(
        case
          when tsq is not null and tsq <> ''::tsquery
            and to_tsvector('english', b.blob) @@ tsq
          then ts_rank(to_tsvector('english', b.blob), tsq)
          else 0::real
        end,
        case when b.blob ilike '%' || q || '%' then 0.05::real else 0::real end
      ) as r
    from base b
  )
  select s.id, s.r::real
  from scored s
  where s.r > 0
  order by s.r desc
  limit lim;
end;
$$;

create or replace function public.keyword_search_opportunities(
  p_query text,
  p_limit integer
)
returns table (
  id uuid,
  kw_rank real
)
language plpgsql
stable
as $$
declare
  q text := trim(coalesce(p_query, ''));
  lim int := greatest(1, least(coalesce(p_limit, 40), 200));
  tsq tsquery;
begin
  if q = '' then
    return;
  end if;

  tsq := websearch_to_tsquery('english', q);
  if tsq is null or tsq = ''::tsquery then
    tsq := plainto_tsquery('english', q);
  end if;

  return query
  with base as (
    select
      o.id,
      (
        coalesce(o.embedding_text, '') || ' ' || coalesce(o.description, '') || ' ' ||
        coalesce(o.name, '') || ' ' || coalesce(array_to_string(o.sector, ' '), '') || ' ' ||
        coalesce(array_to_string(o.need_types, ' '), '')
      ) as blob
    from public.opportunities o
    where o.status = 'active'
  ),
  scored as (
    select
      b.id,
      greatest(
        case
          when tsq is not null and tsq <> ''::tsquery
            and to_tsvector('english', b.blob) @@ tsq
          then ts_rank(to_tsvector('english', b.blob), tsq)
          else 0::real
        end,
        case when b.blob ilike '%' || q || '%' then 0.05::real else 0::real end
      ) as r
    from base b
  )
  select s.id, s.r::real
  from scored s
  where s.r > 0
  order by s.r desc
  limit lim;
end;
$$;

comment on function public.keyword_search_people(text, integer) is
  'Phase 5 fallback: rank people by FTS / ILIKE on searchable text.';
comment on function public.keyword_search_opportunities(text, integer) is
  'Phase 5 fallback: rank opportunities by FTS / ILIKE on searchable text.';

grant execute on function public.keyword_search_people(text, integer) to service_role;
grant execute on function public.keyword_search_opportunities(text, integer) to service_role;
