-- Soft-delete user content, hide it from normal reads, keep an archive + internal backups.
-- Free-tier Supabase has no PITR; archived_records + internal_backups recover accidental deletes.

create table if not exists public.archived_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity text not null,
  entity_id text not null,
  title text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  deleted_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists archived_records_user_deleted_idx
  on public.archived_records (user_id, deleted_at desc);

create unique index if not exists archived_records_active_unique
  on public.archived_records (user_id, entity, entity_id)
  where restored_at is null;

alter table public.archived_records enable row level security;

create table if not exists public.internal_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('archive', 'scheduled', 'export')),
  entity text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists internal_backups_user_created_idx
  on public.internal_backups (user_id, created_at desc);

alter table public.internal_backups enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'nutrition_logs',
    'workout_logs',
    'expenses',
    'pantry_items',
    'grocery_items',
    'health_goals',
    'health_history',
    'gym_sessions',
    'gym_plans',
    'habits',
    'challenges',
    'journal_entries',
    'user_reminders'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column if not exists deleted_at timestamptz',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (user_id) where deleted_at is null',
      t || '_user_active_idx',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (user_id, deleted_at desc) where deleted_at is not null',
      t || '_user_deleted_idx',
      t
    );
  end loop;
end $$;

-- Hide archived rows from normal SELECT. Members cannot hard-delete (no DELETE policy).
-- Super-admin reads stay on active rows so dashboards match the member UI.

drop policy if exists "Members manage challenges" on public.challenges;
drop policy if exists "Members manage expenses" on public.expenses;
drop policy if exists "Users manage expenses" on public.expenses;
drop policy if exists "Members manage grocery items" on public.grocery_items;
drop policy if exists "Users manage grocery items" on public.grocery_items;
drop policy if exists "Users manage own gym plans" on public.gym_plans;
drop policy if exists "Users manage own gym sessions" on public.gym_sessions;
drop policy if exists "Members manage habits" on public.habits;
drop policy if exists "Members manage their health goals" on public.health_goals;
drop policy if exists "Users manage own health history" on public.health_history;
drop policy if exists "Members manage journal" on public.journal_entries;
drop policy if exists "Members manage nutrition logs" on public.nutrition_logs;
drop policy if exists "Users manage nutrition logs" on public.nutrition_logs;
drop policy if exists "Members manage pantry items" on public.pantry_items;
drop policy if exists "Users manage pantry items" on public.pantry_items;
drop policy if exists "Members manage reminders" on public.user_reminders;
drop policy if exists "Members manage workout logs" on public.workout_logs;
drop policy if exists "Users manage workout logs" on public.workout_logs;

drop policy if exists "Super admins read all challenges" on public.challenges;
drop policy if exists "Super admins read all expenses" on public.expenses;
drop policy if exists "Super admins read all grocery items" on public.grocery_items;
drop policy if exists "Super admins read all gym plans" on public.gym_plans;
drop policy if exists "Super admins read all gym sessions" on public.gym_sessions;
drop policy if exists "Super admins read all habits" on public.habits;
drop policy if exists "Super admins read all health goals" on public.health_goals;
drop policy if exists "Super admins read all health history" on public.health_history;
drop policy if exists "Super admins read all journal" on public.journal_entries;
drop policy if exists "Super admins read all nutrition logs" on public.nutrition_logs;
drop policy if exists "Super admins read all pantry items" on public.pantry_items;
drop policy if exists "Super admins read all reminders" on public.user_reminders;
drop policy if exists "Super admins read all workout logs" on public.workout_logs;

do $$
declare
  t text;
  tables text[] := array[
    'nutrition_logs',
    'workout_logs',
    'expenses',
    'pantry_items',
    'grocery_items',
    'health_goals',
    'health_history',
    'gym_sessions',
    'gym_plans',
    'habits',
    'challenges',
    'journal_entries',
    'user_reminders'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (((select auth.uid()) = user_id) and deleted_at is null)',
      'Members read active ' || t,
      t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      'Members insert ' || t,
      t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (((select auth.uid()) = user_id) and deleted_at is null) with check ((select auth.uid()) = user_id)',
      'Members update ' || t,
      t
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.is_super_admin() and deleted_at is null)',
      'Super admins read active ' || t,
      t
    );
  end loop;
end $$;

drop policy if exists "Members read own archived records" on public.archived_records;
drop policy if exists "Members insert own archived records" on public.archived_records;
drop policy if exists "Members update own archived records" on public.archived_records;
drop policy if exists "Staff read archived records" on public.archived_records;

create policy "Members read own archived records"
  on public.archived_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members insert own archived records"
  on public.archived_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members update own archived records"
  on public.archived_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Staff read archived records"
  on public.archived_records for select
  to authenticated
  using (private.is_staff());

drop policy if exists "Members read own backups" on public.internal_backups;
drop policy if exists "Members insert own backups" on public.internal_backups;
drop policy if exists "Staff read backups" on public.internal_backups;

create policy "Members read own backups"
  on public.internal_backups for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members insert own backups"
  on public.internal_backups for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Staff read backups"
  on public.internal_backups for select
  to authenticated
  using (private.is_staff());

grant select, insert, update on public.archived_records to authenticated;
grant select, insert on public.internal_backups to authenticated;
grant all on public.archived_records to service_role;
grant all on public.internal_backups to service_role;
