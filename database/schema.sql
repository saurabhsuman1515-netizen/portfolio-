-- Run once in Supabase: SQL Editor → New query → paste this file → Run.
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  source text not null default 'portfolio'
);
alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;
grant usage on schema public to service_role;
grant insert on table public.contact_messages to service_role;
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
