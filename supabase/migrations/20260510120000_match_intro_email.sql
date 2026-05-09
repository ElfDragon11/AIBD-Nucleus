-- Per-match mutual intro copy + send tracking; optional program contact for opportunities.
alter table public.match_records
  add column if not exists intro_email_draft text,
  add column if not exists intro_sent_at timestamptz;

comment on column public.match_records.intro_email_draft is 'Pre-filled introduction email (lead ↔ person or opportunity contact); Phase 6 admin.';
comment on column public.match_records.intro_sent_at is 'Set when intro email is sent via Resend (Edge send-intro-email).';

alter table public.opportunities
  add column if not exists contact_email text;

comment on column public.opportunities.contact_email is 'Optional steward inbox for mutual intro emails when match is to an opportunity.';
