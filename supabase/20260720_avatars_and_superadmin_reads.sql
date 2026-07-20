-- Public avatars bucket + storage RLS (user folder = auth.uid()).
-- Applied live to project gcqbuccazplfpmuhperg.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Ensure super-admin read access for newer modules (idempotent).
drop policy if exists "Super admins read all gym sessions" on public.gym_sessions;
create policy "Super admins read all gym sessions"
  on public.gym_sessions for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all gym plans" on public.gym_plans;
create policy "Super admins read all gym plans"
  on public.gym_plans for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all health history" on public.health_history;
create policy "Super admins read all health history"
  on public.health_history for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins read all health goals" on public.health_goals;
create policy "Super admins read all health goals"
  on public.health_goals for select to authenticated
  using (private.is_super_admin());
