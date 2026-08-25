-- Recreate gym_plans member policies.
-- 20260820 dropped "Users manage own gym plans" and was supposed to add
-- Members insert/update. If that loop did not apply, inserts fail with:
--   new row violates row-level security policy for table "gym_plans"

alter table public.gym_plans add column if not exists deleted_at timestamptz;

drop policy if exists "Users manage own gym plans" on public.gym_plans;
drop policy if exists "Super admins read all gym plans" on public.gym_plans;
drop policy if exists "Members read active gym_plans" on public.gym_plans;
drop policy if exists "Members insert gym_plans" on public.gym_plans;
drop policy if exists "Members update gym_plans" on public.gym_plans;
drop policy if exists "Super admins read active gym_plans" on public.gym_plans;

create policy "Members read active gym_plans"
  on public.gym_plans for select to authenticated
  using (((select auth.uid()) = user_id) and deleted_at is null);

create policy "Members insert gym_plans"
  on public.gym_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members update gym_plans"
  on public.gym_plans for update to authenticated
  using (((select auth.uid()) = user_id) and deleted_at is null)
  with check ((select auth.uid()) = user_id);

create policy "Super admins read active gym_plans"
  on public.gym_plans for select to authenticated
  using (private.is_super_admin() and deleted_at is null);
