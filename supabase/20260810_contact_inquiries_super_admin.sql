-- Align contact_inquiries RLS with app gates (super_admin only).
drop policy if exists "Staff read inquiries" on public.contact_inquiries;
create policy "Super admins read inquiries"
  on public.contact_inquiries for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Staff update inquiries" on public.contact_inquiries;
create policy "Super admins update inquiries"
  on public.contact_inquiries for update to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());
