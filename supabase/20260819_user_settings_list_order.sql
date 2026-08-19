-- Member-defined display order for saved grocery/pantry/habit/goal/reminder lists.
alter table public.user_settings
  add column if not exists list_order jsonb not null default '{}'::jsonb;

comment on column public.user_settings.list_order is
  'Member-defined display order for saved lists, keyed by module.';
