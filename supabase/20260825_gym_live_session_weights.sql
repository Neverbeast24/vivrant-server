-- Persist live-session working loads so web and mobile stay in sync.
alter table public.gym_live_sessions
  add column if not exists weights jsonb not null default '{}'::jsonb;
