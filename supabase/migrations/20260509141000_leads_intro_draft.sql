-- Phase 6: staff-editable intro copy for demos and CRM handoff.
alter table public.leads
  add column if not exists intro_draft text;

comment on column public.leads.intro_draft is 'Human-reviewed intro email/message draft; Phase 6 admin dashboard.';
