-- Persist per-move sets/mins/rest so +Set and treadmill minutes survive reload.
alter table public.gym_live_sessions
  add column if not exists meta jsonb not null default '{}'::jsonb;
