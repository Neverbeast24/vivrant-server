-- Recreate member insert/update policies for every archived module.
-- 20260820 dropped the old FOR ALL policies. If the follow-up loop did not
-- apply, writes fail with:
--   new row violates row-level security policy for table "<name>"
-- Soft-delete (UPDATE deleted_at) also needs WITH CHECK that does not
-- require deleted_at is null — otherwise trash-can archive fails.

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
  end loop;
end $$;

drop policy if exists "Users manage nutrition logs" on public.nutrition_logs;
drop policy if exists "Members manage nutrition logs" on public.nutrition_logs;
drop policy if exists "Users manage workout logs" on public.workout_logs;
drop policy if exists "Members manage workout logs" on public.workout_logs;
drop policy if exists "Users manage expenses" on public.expenses;
drop policy if exists "Members manage expenses" on public.expenses;
drop policy if exists "Users manage pantry items" on public.pantry_items;
drop policy if exists "Members manage pantry items" on public.pantry_items;
drop policy if exists "Users manage grocery items" on public.grocery_items;
drop policy if exists "Members manage grocery items" on public.grocery_items;
drop policy if exists "Members manage their health goals" on public.health_goals;
drop policy if exists "Users manage own health history" on public.health_history;
drop policy if exists "Users manage own gym sessions" on public.gym_sessions;
drop policy if exists "Users manage own gym plans" on public.gym_plans;
drop policy if exists "Members manage habits" on public.habits;
drop policy if exists "Members manage challenges" on public.challenges;
drop policy if exists "Members manage journal" on public.journal_entries;
drop policy if exists "Members manage reminders" on public.user_reminders;

drop policy if exists "Super admins read all nutrition logs" on public.nutrition_logs;
drop policy if exists "Super admins read all workout logs" on public.workout_logs;
drop policy if exists "Super admins read all expenses" on public.expenses;
drop policy if exists "Super admins read all pantry items" on public.pantry_items;
drop policy if exists "Super admins read all grocery items" on public.grocery_items;
drop policy if exists "Super admins read all health goals" on public.health_goals;
drop policy if exists "Super admins read all health history" on public.health_history;
drop policy if exists "Super admins read all gym sessions" on public.gym_sessions;
drop policy if exists "Super admins read all gym plans" on public.gym_plans;
drop policy if exists "Super admins read all habits" on public.habits;
drop policy if exists "Super admins read all challenges" on public.challenges;
drop policy if exists "Super admins read all journal" on public.journal_entries;
drop policy if exists "Super admins read all reminders" on public.user_reminders;

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
    execute format('drop policy if exists %I on public.%I', 'Members read active ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Members insert ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Members update ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Super admins read active ' || t, t);

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
    -- USING hides already-archived rows from edits.
    -- WITH CHECK allows setting deleted_at so trash-can archive succeeds.
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

    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;
