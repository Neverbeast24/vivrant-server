-- Persist extra moves, removed rows, and work-vs-rest so web and mobile stay in sync.
alter table public.gym_live_sessions
  add column if not exists extras jsonb not null default '[]'::jsonb,
  add column if not exists removed_keys jsonb not null default '[]'::jsonb,
  add column if not exists rest_kind text;
