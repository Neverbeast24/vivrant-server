-- Program builder drafts (cherry-pick AI days) + live workout session restore.
-- One row per user so web and mobile stay in sync.

create table if not exists public.gym_program_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  title text not null default 'Your VIVRΛNT gym program',
  focus text not null default 'full_body',
  level text not null default 'beginner',
  summary text,
  recommendations jsonb not null default '[]'::jsonb,
  prefs jsonb not null default '{}'::jsonb,
  preview_days jsonb not null default '[]'::jsonb,
  kept_days jsonb not null default '{}'::jsonb,
  training_days int[] not null default '{}'::int[],
  updated_at timestamptz not null default now()
);

create table if not exists public.gym_live_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id bigint,
  day_label text not null default '',
  session_date date not null,
  checks jsonb not null default '{}'::jsonb,
  names jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  rest_ends_at timestamptz,
  rest_label text,
  rest_total int,
  rest_alerted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.gym_program_drafts enable row level security;
alter table public.gym_live_sessions enable row level security;

drop policy if exists "Users manage own gym program drafts" on public.gym_program_drafts;
create policy "Users manage own gym program drafts"
  on public.gym_program_drafts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Super admins read all gym program drafts" on public.gym_program_drafts;
create policy "Super admins read all gym program drafts"
  on public.gym_program_drafts for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Users manage own gym live sessions" on public.gym_live_sessions;
create policy "Users manage own gym live sessions"
  on public.gym_live_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Super admins read all gym live sessions" on public.gym_live_sessions;
create policy "Super admins read all gym live sessions"
  on public.gym_live_sessions for select to authenticated
  using (private.is_super_admin());
