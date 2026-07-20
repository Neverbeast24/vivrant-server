-- Gym module + health history (applied remotely 2026-07-20)
-- Tables: health_history, gym_exercises, gym_sessions, gym_plans

create table if not exists public.health_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  recorded_at date not null default (timezone('utc', now()))::date,
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  body_fat_pct numeric(5,2),
  waist_cm numeric(6,2),
  note text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.gym_exercises (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  muscle_group text not null,
  equipment text not null default 'bodyweight',
  difficulty text not null default 'beginner',
  duration_seconds int not null default 60,
  demo_video_url text not null,
  demo_thumbnail_url text,
  cues text,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  focus text not null default 'full_body',
  duration_minutes int,
  calories_burned int,
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.gym_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  focus text not null,
  level text not null default 'beginner',
  days_per_week int not null default 3,
  summary text,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.health_history enable row level security;
alter table public.gym_exercises enable row level security;
alter table public.gym_sessions enable row level security;
alter table public.gym_plans enable row level security;

drop policy if exists "Users manage own health history" on public.health_history;
create policy "Users manage own health history"
  on public.health_history for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Super admins read all health history" on public.health_history;
create policy "Super admins read all health history"
  on public.health_history for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Authenticated read gym exercises" on public.gym_exercises;
create policy "Authenticated read gym exercises"
  on public.gym_exercises for select to authenticated
  using (true);

drop policy if exists "Users manage own gym sessions" on public.gym_sessions;
create policy "Users manage own gym sessions"
  on public.gym_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Super admins read all gym sessions" on public.gym_sessions;
create policy "Super admins read all gym sessions"
  on public.gym_sessions for select to authenticated
  using (private.is_super_admin());

drop policy if exists "Users manage own gym plans" on public.gym_plans;
create policy "Users manage own gym plans"
  on public.gym_plans for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Super admins read all gym plans" on public.gym_plans;
create policy "Super admins read all gym plans"
  on public.gym_plans for select to authenticated
  using (private.is_super_admin());

create index if not exists health_history_user_recorded_idx
  on public.health_history (user_id, recorded_at desc);
create index if not exists gym_sessions_user_logged_idx
  on public.gym_sessions (user_id, logged_at desc);
create index if not exists gym_plans_user_created_idx
  on public.gym_plans (user_id, created_at desc);

insert into public.gym_exercises (
  slug, name, muscle_group, equipment, difficulty, duration_seconds,
  demo_video_url, demo_thumbnail_url, cues
) values
  ('bodyweight-squat', 'Bodyweight squat', 'legs', 'bodyweight', 'beginner', 45,
   'https://www.youtube.com/embed/aclHkVaku9U', 'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
   'Feet shoulder-width, sit back, knees track over toes.'),
  ('push-up', 'Push-up', 'chest', 'bodyweight', 'beginner', 40,
   'https://www.youtube.com/embed/IODxDxX7oi4', 'https://img.youtube.com/vi/IODxDxX7oi4/hqdefault.jpg',
   'Brace core, lower chest to floor, press up smoothly.'),
  ('dumbbell-row', 'Dumbbell row', 'back', 'dumbbell', 'beginner', 45,
   'https://www.youtube.com/embed/roCP6wCXPqo', 'https://img.youtube.com/vi/roCP6wCXPqo/hqdefault.jpg',
   'Pull elbow back, keep torso still.'),
  ('plank', 'Forearm plank', 'core', 'bodyweight', 'beginner', 45,
   'https://www.youtube.com/embed/ASdvN_XEl_c', 'https://img.youtube.com/vi/ASdvN_XEl_c/hqdefault.jpg',
   'Keep hips level and ribs down.'),
  ('glute-bridge', 'Glute bridge', 'glutes', 'bodyweight', 'beginner', 40,
   'https://www.youtube.com/embed/OUgsJ8-Vi0E', 'https://img.youtube.com/vi/OUgsJ8-Vi0E/hqdefault.jpg',
   'Drive through heels and squeeze glutes at the top.'),
  ('walking-lunge', 'Walking lunge', 'legs', 'bodyweight', 'intermediate', 50,
   'https://www.youtube.com/embed/L8fvypPrzzs', 'https://img.youtube.com/vi/L8fvypPrzzs/hqdefault.jpg',
   'Long stride, front knee stacked above ankle.'),
  ('overhead-press', 'Dumbbell overhead press', 'shoulders', 'dumbbell', 'intermediate', 40,
   'https://www.youtube.com/embed/qEwKCR5JCog', 'https://img.youtube.com/vi/qEwKCR5JCog/hqdefault.jpg',
   'Press up without arching the lower back.'),
  ('romanian-deadlift', 'Romanian deadlift', 'hamstrings', 'dumbbell', 'intermediate', 50,
   'https://www.youtube.com/embed/jEy_czb3RKA', 'https://img.youtube.com/vi/jEy_czb3RKA/hqdefault.jpg',
   'Hinge at hips, slight knee bend, flat back.'),
  ('bicycle-crunch', 'Bicycle crunch', 'core', 'bodyweight', 'beginner', 40,
   'https://www.youtube.com/embed/9FGilxCbdz8', 'https://img.youtube.com/vi/9FGilxCbdz8/hqdefault.jpg',
   'Rotate elbow to opposite knee with control.'),
  ('jumping-jack', 'Jumping jack', 'cardio', 'bodyweight', 'beginner', 40,
   'https://www.youtube.com/embed/iSSAk4XCsRA', 'https://img.youtube.com/vi/iSSAk4XCsRA/hqdefault.jpg',
   'Land softly and keep a steady rhythm.'),
  ('mountain-climber', 'Mountain climber', 'cardio', 'bodyweight', 'intermediate', 40,
   'https://www.youtube.com/embed/nmwgirgXLYM', 'https://img.youtube.com/vi/nmwgirgXLYM/hqdefault.jpg',
   'Drive knees in under a strong plank.'),
  ('hip-flexor-stretch', 'Hip flexor stretch', 'mobility', 'bodyweight', 'beginner', 60,
   'https://www.youtube.com/embed/YQmpO9VT2X4', 'https://img.youtube.com/vi/YQmpO9VT2X4/hqdefault.jpg',
   'Tuck pelvis gently and breathe into the front hip.')
on conflict (slug) do update set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  difficulty = excluded.difficulty,
  duration_seconds = excluded.duration_seconds,
  demo_video_url = excluded.demo_video_url,
  demo_thumbnail_url = excluded.demo_thumbnail_url,
  cues = excluded.cues;

