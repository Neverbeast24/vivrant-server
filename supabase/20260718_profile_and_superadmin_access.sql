-- Rich health profiles and read-only super-admin access to member activity.
-- User-owned RLS policies remain intact; super-admin access is additive and SELECT-only.

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists sex text check (sex in ('female', 'male', 'non_binary', 'prefer_not_to_say')),
  add column if not exists height_cm numeric check (height_cm between 50 and 250),
  add column if not exists weight_kg numeric check (weight_kg between 20 and 400),
  add column if not exists goal_weight_kg numeric check (goal_weight_kg between 20 and 400),
  add column if not exists activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  add column if not exists health_focus text check (
    health_focus in ('general', 'weight', 'strength', 'endurance', 'nutrition', 'sleep', 'stress')
  ),
  add column if not exists daily_step_goal integer not null default 8000
    check (daily_step_goal between 1000 and 100000),
  add column if not exists daily_water_goal_ml integer not null default 2400
    check (daily_water_goal_ml between 250 and 10000),
  add column if not exists monthly_health_budget numeric not null default 2000
    check (monthly_health_budget >= 0),
  add column if not exists bio text check (char_length(bio) <= 500);

-- Members may update their own wellness profile, but role/status/email cannot be
-- self-escalated. Staff management actions retain their existing permissions.
create or replace function private.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.user_id and not private.is_staff() then
    new.role := old.role;
    new.status := old.status;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row execute function private.protect_profile_privileged_fields();

-- Super admins can inspect all member-owned logs. These policies grant no
-- insert/update/delete rights and do not broaden regular admin access.
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

drop policy if exists "Super admins read all daily checkins" on public.daily_checkins;
create policy "Super admins read all daily checkins"
  on public.daily_checkins for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all health goals" on public.health_goals;
create policy "Super admins read all health goals"
  on public.health_goals for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all nutrition logs" on public.nutrition_logs;
create policy "Super admins read all nutrition logs"
  on public.nutrition_logs for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all workout logs" on public.workout_logs;
create policy "Super admins read all workout logs"
  on public.workout_logs for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all expenses" on public.expenses;
create policy "Super admins read all expenses"
  on public.expenses for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all grocery items" on public.grocery_items;
create policy "Super admins read all grocery items"
  on public.grocery_items for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all pantry items" on public.pantry_items;
create policy "Super admins read all pantry items"
  on public.pantry_items for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all AI recommendations" on public.ai_recommendations;
create policy "Super admins read all AI recommendations"
  on public.ai_recommendations for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all notifications" on public.notifications;
create policy "Super admins read all notifications"
  on public.notifications for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all user settings" on public.user_settings;
create policy "Super admins read all user settings"
  on public.user_settings for select to authenticated
  using (private.is_super_admin());

create index if not exists ai_recommendations_user_id_idx
  on public.ai_recommendations (user_id, created_at desc);
create index if not exists audit_logs_actor_id_idx
  on public.audit_logs (actor_id, created_at desc);
create index if not exists expenses_user_id_idx
  on public.expenses (user_id, spent_at desc);
create index if not exists grocery_items_user_id_idx
  on public.grocery_items (user_id, created_at desc);
create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);
create index if not exists nutrition_logs_user_id_idx
  on public.nutrition_logs (user_id, logged_at desc);
create index if not exists pantry_items_user_id_idx
  on public.pantry_items (user_id, created_at desc);
create index if not exists workout_logs_user_id_idx
  on public.workout_logs (user_id, logged_at desc);
