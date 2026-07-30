-- Harden privileged profile updates and relationship ownership.
-- Also add common list/filter indexes.

-- 1) Privileged profile fields.
-- Previously staff were exempt from the self-edit guard, so an admin could
-- promote themselves to super_admin with a direct UPDATE on their own row.
-- Now nobody can change their own role/status, while staff keep the
-- cross-member powers the admin console relies on:
--   * super_admin  -> may change another member's role and status
--   * admin        -> may change another member's status
--   * service role -> unrestricted (auth.uid() is null)
create or replace function private.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Trusted server-side contexts (service key) keep full control.
  if auth.uid() is null then
    return new;
  end if;

  -- Email is owned by auth.users and is never edited through profiles.
  new.email := old.email;

  -- No self-service role/status changes, staff included.
  if auth.uid() = old.user_id then
    new.role := old.role;
    new.status := old.status;
    return new;
  end if;

  if not private.is_super_admin() then
    new.role := old.role;
  end if;

  if not private.is_staff() then
    new.status := old.status;
  end if;

  return new;
end;
$$;

-- 2) Ensure habit_logs.habit_id belongs to the same user_id.
create or replace function private.enforce_habit_log_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.habits h
    where h.id = new.habit_id
      and h.user_id = new.user_id
  ) then
    raise exception 'habit_id does not belong to this user';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_habit_log_owner on public.habit_logs;
create trigger enforce_habit_log_owner
  before insert or update on public.habit_logs
  for each row execute function private.enforce_habit_log_owner();

-- 3) Ensure challenge_progress.challenge_id belongs to the same user_id.
create or replace function private.enforce_challenge_progress_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.challenges c
    where c.id = new.challenge_id
      and c.user_id = new.user_id
  ) then
    raise exception 'challenge_id does not belong to this user';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_challenge_progress_owner on public.challenge_progress;
create trigger enforce_challenge_progress_owner
  before insert or update on public.challenge_progress
  for each row execute function private.enforce_challenge_progress_owner();

-- 4) Indexes for common unread / filter paths
create index if not exists notifications_user_unread_created_idx
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists grocery_items_user_checked_created_idx
  on public.grocery_items (user_id, is_checked, created_at desc);

create index if not exists support_tickets_user_status_created_idx
  on public.support_tickets (user_id, status, created_at desc);
