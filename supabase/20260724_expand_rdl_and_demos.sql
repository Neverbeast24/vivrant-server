-- Surface RDLs more clearly and expand free-weight hinge / pull demos.

update public.gym_exercises
set name = 'Romanian deadlift (RDL)'
where slug = 'romanian-deadlift';

update public.gym_exercises
set name = 'Dumbbell RDL'
where slug = 'dumbbell-rdl';

update public.gym_exercises
set name = 'Single-leg RDL'
where slug = 'single-leg-rdl';

insert into public.gym_exercises (
  slug, name, muscle_group, equipment, difficulty, duration_seconds,
  demo_video_url, demo_thumbnail_url, cues
) values
  ('barbell-rdl', 'Barbell RDL', 'hamstrings', 'dumbbell', 'intermediate', 50,
   'https://www.youtube.com/embed/2SHsk9AzdjA', 'https://img.youtube.com/vi/2SHsk9AzdjA/hqdefault.jpg',
   'Soft knees, push hips back, bar close to legs, flat back.'),
  ('kettlebell-rdl', 'Kettlebell RDL', 'hamstrings', 'dumbbell', 'beginner', 45,
   'https://www.youtube.com/embed/FQKfr1YDhEk', 'https://img.youtube.com/vi/FQKfr1YDhEk/hqdefault.jpg',
   'Hinge with the bell close to your body; feel the stretch in the hamstrings.'),
  ('stiff-leg-deadlift', 'Stiff-leg deadlift', 'hamstrings', 'dumbbell', 'intermediate', 50,
   'https://www.youtube.com/embed/jEy_czb3RKA', 'https://img.youtube.com/vi/jEy_czb3RKA/hqdefault.jpg',
   'Minimal knee bend, hinge from the hips, keep the spine neutral.'),
  ('conventional-deadlift', 'Conventional deadlift', 'legs', 'dumbbell', 'intermediate', 55,
   'https://www.youtube.com/embed/op9kVnSso6Q', 'https://img.youtube.com/vi/op9kVnSso6Q/hqdefault.jpg',
   'Brace hard, push the floor away, lock out hips and knees together.'),
  ('sumo-deadlift', 'Sumo deadlift', 'legs', 'dumbbell', 'intermediate', 55,
   'https://www.youtube.com/embed/3XDriUn0udo', 'https://img.youtube.com/vi/3XDriUn0udo/hqdefault.jpg',
   'Wide stance, toes out, keep chest tall and push through mid-foot.'),
  ('rack-pull', 'Rack pull', 'back', 'dumbbell', 'intermediate', 45,
   'https://www.youtube.com/embed/op9kVnSso6Q', 'https://img.youtube.com/vi/op9kVnSso6Q/hqdefault.jpg',
   'Start just below the knee, drive hips forward, squeeze upper back at the top.'),
  ('barbell-bent-over-row', 'Barbell bent-over row', 'back', 'dumbbell', 'intermediate', 45,
   'https://www.youtube.com/embed/FWJR5Ve8bnQ', 'https://img.youtube.com/vi/FWJR5Ve8bnQ/hqdefault.jpg',
   'Hinge, pull bar to lower ribs, keep torso still.'),
  ('pendlay-row', 'Pendlay row', 'back', 'dumbbell', 'intermediate', 45,
   'https://www.youtube.com/embed/FWJR5Ve8bnQ', 'https://img.youtube.com/vi/FWJR5Ve8bnQ/hqdefault.jpg',
   'Each rep starts from the floor; explosive pull, controlled lower.'),
  ('reverse-lunge', 'Reverse lunge', 'legs', 'bodyweight', 'beginner', 40,
   'https://www.youtube.com/embed/L8fvypPrzzs', 'https://img.youtube.com/vi/L8fvypPrzzs/hqdefault.jpg',
   'Step back, front knee stacked over mid-foot, drive through the front heel.'),
  ('jump-squat', 'Jump squat', 'legs', 'bodyweight', 'intermediate', 40,
   'https://www.youtube.com/embed/wS4OsJ4yzx4', 'https://img.youtube.com/vi/wS4OsJ4yzx4/hqdefault.jpg',
   'Sit into a squat, explode up, land softly with knees tracking toes.'),
  ('concentration-curl', 'Concentration curl', 'arms', 'dumbbell', 'beginner', 35,
   'https://www.youtube.com/embed/ykJmrZ5v0Oo', 'https://img.youtube.com/vi/ykJmrZ5v0Oo/hqdefault.jpg',
   'Elbow braced on inner thigh, curl without swinging.'),
  ('skull-crusher', 'Skull crusher', 'arms', 'dumbbell', 'intermediate', 40,
   'https://www.youtube.com/embed/2-LAMcpzODU', 'https://img.youtube.com/vi/2-LAMcpzODU/hqdefault.jpg',
   'Elbows point up, lower weight beside the head, extend without flaring.'),
  ('suitcase-carry', 'Suitcase carry', 'full_body', 'dumbbell', 'beginner', 45,
   'https://www.youtube.com/embed/Fkzk_RqlYig', 'https://img.youtube.com/vi/Fkzk_RqlYig/hqdefault.jpg',
   'Hold weight on one side, walk tall without leaning.'),
  ('pallof-press', 'Pallof press', 'core', 'cable', 'beginner', 40,
   'https://www.youtube.com/embed/ljgqer1ZpXg', 'https://img.youtube.com/vi/ljgqer1ZpXg/hqdefault.jpg',
   'Press straight out against the cable; resist rotation.'),
  ('close-grip-push-up', 'Close-grip push-up', 'arms', 'bodyweight', 'intermediate', 35,
   'https://www.youtube.com/embed/IODxDxX7oi4', 'https://img.youtube.com/vi/IODxDxX7oi4/hqdefault.jpg',
   'Hands under chest, elbows close to ribs, lower with control.')
on conflict (slug) do update set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  difficulty = excluded.difficulty,
  duration_seconds = excluded.duration_seconds,
  demo_video_url = excluded.demo_video_url,
  demo_thumbnail_url = excluded.demo_thumbnail_url,
  cues = excluded.cues;
