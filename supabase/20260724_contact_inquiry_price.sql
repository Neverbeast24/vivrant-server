-- Quoted price + email audit for contact inquiries

alter table public.contact_inquiries
  add column if not exists quoted_price numeric(12,2),
  add column if not exists price_emailed_at timestamptz;

alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_quoted_price_check;

alter table public.contact_inquiries
  add constraint contact_inquiries_quoted_price_check
  check (quoted_price is null or quoted_price >= 0);
