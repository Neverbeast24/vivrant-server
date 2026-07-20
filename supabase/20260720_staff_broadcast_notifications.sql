-- Staff can broadcast in-app notifications to members (applied 2026-07-20).

drop policy if exists "Staff insert notifications" on public.notifications;
create policy "Staff insert notifications"
  on public.notifications for insert to authenticated
  with check (private.is_staff());

drop policy if exists "Staff read notifications they manage" on public.notifications;
create policy "Staff read notifications they manage"
  on public.notifications for select to authenticated
  using (private.is_staff());
