-- Public contact inquiries (Plus / Campus / general). Staff read/update; inserts via service role.

create table if not exists public.contact_inquiries (
  id bigint generated always as identity primary key,
  plan text not null default 'general' check (plan in ('general', 'plus', 'campus')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  organization text check (organization is null or char_length(organization) <= 160),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_inquiries_status_created_idx
  on public.contact_inquiries (status, created_at desc);

create index if not exists contact_inquiries_email_created_idx
  on public.contact_inquiries (email, created_at desc);

drop trigger if exists contact_inquiries_set_updated_at on public.contact_inquiries;
create trigger contact_inquiries_set_updated_at
  before update on public.contact_inquiries
  for each row execute function private.set_updated_at();

alter table public.contact_inquiries enable row level security;

drop policy if exists "Staff read inquiries" on public.contact_inquiries;
create policy "Staff read inquiries"
  on public.contact_inquiries for select to authenticated
  using (private.is_staff());

drop policy if exists "Staff update inquiries" on public.contact_inquiries;
create policy "Staff update inquiries"
  on public.contact_inquiries for update to authenticated
  using (private.is_staff())
  with check (private.is_staff());

-- No public insert policy: server actions insert with the service-role key.
