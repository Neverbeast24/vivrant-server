-- Run in Supabase → SQL Editor
-- Fixes "No rows returned" when updating by email (profiles.email was empty)

-- 1) Backfill emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

-- 2) Verify profiles
select user_id, display_name, email, role, status
from public.profiles
order by created_at desc;

-- 3) Promote your account (replace email with yours)
-- update public.profiles
-- set role = 'super_admin'
-- where email = 'you@example.com';
