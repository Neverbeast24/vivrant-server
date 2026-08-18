-- OAuth-only accounts (Google / GitHub) can store a password via recovery
-- without getting an `email` identity. Password sign-in then fails even when
-- the password is right. These helpers:
--   1) look up whether an email has a password / social providers
--   2) attach an email identity after a password is set
-- Both public wrappers are service-role only (no email enumeration via anon).

create or replace function private.auth_login_hints(lookup_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u auth.users%rowtype;
  providers jsonb;
begin
  if lookup_email is null or btrim(lookup_email) = '' then
    return null;
  end if;

  select *
    into u
  from auth.users
  where lower(email) = lower(btrim(lookup_email))
  limit 1;

  if not found then
    return null;
  end if;

  providers := coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb);
  if jsonb_typeof(providers) <> 'array' then
    providers := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'user_id', u.id,
    'has_password', coalesce(u.encrypted_password, '') <> '',
    'has_email_identity', exists (
      select 1
      from auth.identities i
      where i.user_id = u.id
        and i.provider = 'email'
    ),
    'providers', providers
  );
end;
$$;

create or replace function private.ensure_email_identity(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  u auth.users%rowtype;
  providers text[];
begin
  if target_user_id is null then
    return;
  end if;

  select * into u from auth.users where id = target_user_id;
  if not found then
    return;
  end if;
  if u.email is null or btrim(u.email) = '' then
    return;
  end if;
  if coalesce(u.encrypted_password, '') = '' then
    return;
  end if;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    u.id,
    u.id::text,
    'email',
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', u.email_confirmed_at is not null
    ),
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do nothing;

  select coalesce(array_agg(distinct p), array['email']::text[])
    into providers
  from unnest(
    array_cat(
      coalesce(
        (
          select array_agg(x)
          from jsonb_array_elements_text(
            coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb)
          ) as x
        ),
        array[]::text[]
      ),
      array['email']::text[]
    )
  ) as p;

  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('providers', to_jsonb(providers)),
      updated_at = now()
  where id = u.id;
end;
$$;

create or replace function public.auth_login_hints(lookup_email text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.auth_login_hints(lookup_email);
$$;

create or replace function public.ensure_email_identity_for_user(target_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.ensure_email_identity(target_user_id);
$$;

revoke all on function public.auth_login_hints(text) from public, anon, authenticated;
revoke all on function public.ensure_email_identity_for_user(uuid) from public, anon, authenticated;
grant execute on function public.auth_login_hints(text) to service_role;
grant execute on function public.ensure_email_identity_for_user(uuid) to service_role;
