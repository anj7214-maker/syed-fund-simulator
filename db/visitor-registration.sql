create table if not exists public.visitor_registrations (
  id uuid primary key,
  name text not null,
  email text not null,
  profile text not null check (profile in ('student', 'professional')),
  college text not null default '',
  industry text not null default '',
  company text not null default '',
  access_consent boolean not null check (access_consent),
  marketing_consent boolean not null default false,
  notice_version text not null,
  privacy_notice text not null,
  access_consent_text text not null,
  marketing_consent_text text not null,
  consent_at timestamptz not null,
  marketing_withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  check ((profile = 'student' and college <> '') or (profile = 'professional' and industry <> ''))
);
alter table public.visitor_registrations enable row level security;
revoke all on public.visitor_registrations from anon, authenticated;
grant select, insert, update, delete on public.visitor_registrations to service_role;
create index if not exists visitor_registrations_email_idx on public.visitor_registrations (email);
