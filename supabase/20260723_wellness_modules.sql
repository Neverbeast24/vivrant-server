-- VIVRΛNT wellness modules + missing core table dumps + reminders
-- Safe to re-run: IF NOT EXISTS / drop policy if exists patterns.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role = 'super_admin'
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles role alignment
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin', 'member'));

update public.profiles set role = 'user' where role = 'member';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

alter table public.profiles
  alter column role set default 'user';

alter table public.daily_checkins
  add column if not exists sleep_quality smallint
    check (sleep_quality is null or sleep_quality between 1 and 5),
  add column if not exists bedtime time,
  add column if not exists wake_time time;

-- ---------------------------------------------------------------------------
-- Missing core tables (CREATE IF NOT EXISTS for fresh installs)
-- ---------------------------------------------------------------------------

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notifications_enabled boolean not null default true,
  weekly_report_enabled boolean not null default true,
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_name text not null check (char_length(meal_name) between 1 and 120),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  calories integer check (calories is null or calories >= 0),
  protein_g numeric check (protein_g is null or protein_g >= 0),
  carbs_g numeric check (carbs_g is null or carbs_g >= 0),
  fat_g numeric check (fat_g is null or fat_g >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  activity_type text not null check (
    activity_type in ('walk', 'run', 'strength', 'cycle', 'yoga', 'other')
  ),
  duration_minutes integer not null check (duration_minutes >= 1),
  calories_burned integer check (calories_burned is null or calories_burned >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (
    category in ('food', 'fitness', 'supplements', 'wellness', 'other')
  ),
  amount numeric not null check (amount >= 0),
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  quantity text,
  category text not null default 'other',
  is_checked boolean not null default false,
  estimated_price numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.pantry_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'other',
  stock_level integer not null default 50 check (stock_level between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  score numeric,
  source text not null default 'insight',
  created_at timestamptz not null default now()
);

alter table public.ai_recommendations
  add column if not exists source text not null default 'insight';

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'viva')),
  content text not null check (char_length(content) between 1 and 4000),
  follow_up text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_reminders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  kind text not null default 'custom' check (
    kind in ('gym', 'plan', 'hydration', 'sleep', 'habit', 'mindfulness', 'custom')
  ),
  schedule_time time not null default '09:00',
  days_of_week integer[] not null default '{1,2,3,4,5,6,7}',
  next_fire_at timestamptz,
  last_sent_at timestamptz,
  enabled boolean not null default true,
  href text check (href is null or char_length(href) <= 500),
  source_id text,
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null default 'other' check (
    category in ('nutrition', 'movement', 'sleep', 'mindfulness', 'hydration', 'other')
  ),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  target_per_period integer not null default 1 check (target_per_period between 1 and 14),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id bigint generated always as identity primary key,
  habit_id bigint not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, logged_on)
);

create table if not exists public.challenges (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  metric text not null check (
    metric in ('habits', 'workouts', 'water', 'sleep', 'checkins', 'gym')
  ),
  target_value numeric not null check (target_value > 0),
  starts_on date not null default current_date,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.challenge_progress (
  id bigint generated always as identity primary key,
  challenge_id bigint not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_value numeric not null default 0,
  completed boolean not null default false,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.journal_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 8000),
  mood smallint check (mood is null or mood between 1 and 5),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists nutrition_logs_user_id_idx on public.nutrition_logs (user_id, logged_at desc);
create index if not exists workout_logs_user_id_idx on public.workout_logs (user_id, logged_at desc);
create index if not exists expenses_user_id_idx on public.expenses (user_id, spent_at desc);
create index if not exists grocery_items_user_id_idx on public.grocery_items (user_id, created_at desc);
create index if not exists pantry_items_user_id_idx on public.pantry_items (user_id, created_at desc);
create index if not exists ai_recommendations_user_id_idx on public.ai_recommendations (user_id, created_at desc);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists ai_chat_messages_user_id_idx on public.ai_chat_messages (user_id, created_at desc);
create index if not exists user_reminders_due_idx on public.user_reminders (enabled, next_fire_at) where enabled = true;
create index if not exists user_reminders_user_id_idx on public.user_reminders (user_id, created_at desc);
create index if not exists habits_user_id_idx on public.habits (user_id, active);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, logged_on desc);
create index if not exists challenges_user_id_idx on public.challenges (user_id, ends_on desc);
create index if not exists challenge_progress_user_idx on public.challenge_progress (user_id, challenge_id);
create index if not exists journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);

-- RLS
alter table public.user_settings enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.expenses enable row level security;
alter table public.grocery_items enable row level security;
alter table public.pantry_items enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.user_reminders enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.journal_entries enable row level security;

-- Member policies (idempotent)
drop policy if exists "Members manage user settings" on public.user_settings;
create policy "Members manage user settings"
  on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage nutrition logs" on public.nutrition_logs;
create policy "Members manage nutrition logs"
  on public.nutrition_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage workout logs" on public.workout_logs;
create policy "Members manage workout logs"
  on public.workout_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage expenses" on public.expenses;
create policy "Members manage expenses"
  on public.expenses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage grocery items" on public.grocery_items;
create policy "Members manage grocery items"
  on public.grocery_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage pantry items" on public.pantry_items;
create policy "Members manage pantry items"
  on public.pantry_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage AI recommendations" on public.ai_recommendations;
create policy "Members manage AI recommendations"
  on public.ai_recommendations for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members insert own audit logs" on public.audit_logs;
create policy "Members insert own audit logs"
  on public.audit_logs for insert to authenticated
  with check ((select auth.uid()) = actor_id);

drop policy if exists "Staff read audit logs" on public.audit_logs;
create policy "Staff read audit logs"
  on public.audit_logs for select to authenticated
  using (private.is_staff() or (select auth.uid()) = actor_id);

drop policy if exists "Members manage ai chat" on public.ai_chat_messages;
create policy "Members manage ai chat"
  on public.ai_chat_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage reminders" on public.user_reminders;
create policy "Members manage reminders"
  on public.user_reminders for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage habits" on public.habits;
create policy "Members manage habits"
  on public.habits for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage habit logs" on public.habit_logs;
create policy "Members manage habit logs"
  on public.habit_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage challenges" on public.challenges;
create policy "Members manage challenges"
  on public.challenges for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage challenge progress" on public.challenge_progress;
create policy "Members manage challenge progress"
  on public.challenge_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members manage journal" on public.journal_entries;
create policy "Members manage journal"
  on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Super-admin reads
drop policy if exists "Super admins read all user settings" on public.user_settings;
create policy "Super admins read all user settings"
  on public.user_settings for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all nutrition logs" on public.nutrition_logs;
create policy "Super admins read all nutrition logs"
  on public.nutrition_logs for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all workout logs" on public.workout_logs;
create policy "Super admins read all workout logs"
  on public.workout_logs for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all expenses" on public.expenses;
create policy "Super admins read all expenses"
  on public.expenses for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all grocery items" on public.grocery_items;
create policy "Super admins read all grocery items"
  on public.grocery_items for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all pantry items" on public.pantry_items;
create policy "Super admins read all pantry items"
  on public.pantry_items for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all AI recommendations" on public.ai_recommendations;
create policy "Super admins read all AI recommendations"
  on public.ai_recommendations for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all ai chat" on public.ai_chat_messages;
create policy "Super admins read all ai chat"
  on public.ai_chat_messages for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all reminders" on public.user_reminders;
create policy "Super admins read all reminders"
  on public.user_reminders for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all habits" on public.habits;
create policy "Super admins read all habits"
  on public.habits for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all habit logs" on public.habit_logs;
create policy "Super admins read all habit logs"
  on public.habit_logs for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all challenges" on public.challenges;
create policy "Super admins read all challenges"
  on public.challenges for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all challenge progress" on public.challenge_progress;
create policy "Super admins read all challenge progress"
  on public.challenge_progress for select to authenticated using (private.is_super_admin());

drop policy if exists "Super admins read all journal" on public.journal_entries;
create policy "Super admins read all journal"
  on public.journal_entries for select to authenticated using (private.is_super_admin());

-- updated_at triggers
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function private.set_updated_at();

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function private.set_updated_at();

drop trigger if exists user_reminders_set_updated_at on public.user_reminders;
create trigger user_reminders_set_updated_at
  before update on public.user_reminders
  for each row execute function private.set_updated_at();

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function private.set_updated_at();

drop trigger if exists challenge_progress_set_updated_at on public.challenge_progress;
create trigger challenge_progress_set_updated_at
  before update on public.challenge_progress
  for each row execute function private.set_updated_at();

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function private.set_updated_at();
