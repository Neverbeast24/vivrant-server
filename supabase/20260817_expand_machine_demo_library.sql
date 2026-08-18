-- Broader gym-floor machine / cable / cardio demos, plus a few mismatched clips.

update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/ELOCsoDSmrg',
  demo_thumbnail_url = 'https://img.youtube.com/vi/ELOCsoDSmrg/hqdefault.jpg',
  cues = 'Pad on lower calves, curl heels under the seat, squeeze hamstrings.'
where slug = 'seated-leg-curl';

update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/xUm0BiZCWlQ',
  demo_thumbnail_url = 'https://img.youtube.com/vi/xUm0BiZCWlQ/hqdefault.jpg',
  cues = 'Handles at mid-chest, press out smoothly without shrugging.'
where slug = 'chest-press-machine';

update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/Iwe6AmxVf7o',
  demo_thumbnail_url = 'https://img.youtube.com/vi/Iwe6AmxVf7o/hqdefault.jpg',
  cues = 'Soft elbows, sweep hands together at chest height, squeeze.'
where slug = 'cable-crossover';

insert into public.gym_exercises (
  slug, name, muscle_group, equipment, difficulty, duration_seconds,
  demo_video_url, demo_thumbnail_url, cues
) values
  -- Chest
  ('incline-chest-press-machine', 'Incline chest press machine', 'chest', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://img.youtube.com/vi/xUm0BiZCWlQ/hqdefault.jpg',
   'Seat so handles sit at upper chest; press without shrugging the shoulders.'),
  ('decline-chest-press-machine', 'Decline chest press machine', 'chest', 'machine', 'intermediate', 40,
   'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://img.youtube.com/vi/xUm0BiZCWlQ/hqdefault.jpg',
   'Handles at lower chest, press out with control, keep ribs down.'),
  ('iso-lateral-chest-press', 'Iso-lateral chest press', 'chest', 'machine', 'intermediate', 40,
   'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://img.youtube.com/vi/xUm0BiZCWlQ/hqdefault.jpg',
   'Press each handle independently; finish with a gentle squeeze.'),
  ('smith-bench-press', 'Smith machine bench press', 'chest', 'machine', 'intermediate', 45,
   'https://www.youtube.com/embed/DbFgADa2PL8', 'https://img.youtube.com/vi/DbFgADa2PL8/hqdefault.jpg',
   'Bar over mid-chest, elbows ~45°, keep feet planted and glutes on the bench.'),
  ('seated-dip-machine', 'Seated dip machine', 'chest', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/sM6XUdt1rm4', 'https://img.youtube.com/vi/sM6XUdt1rm4/hqdefault.jpg',
   'Lean slightly forward, lower until elbows ~90°, press without shrugging.'),
  ('cable-fly-high-to-low', 'High-to-low cable fly', 'chest', 'cable', 'beginner', 40,
   'https://www.youtube.com/embed/Iwe6AmxVf7o', 'https://img.youtube.com/vi/Iwe6AmxVf7o/hqdefault.jpg',
   'Start high, sweep down and together; soft elbows, squeeze lower chest.'),
  ('cable-fly-low-to-high', 'Low-to-high cable fly', 'chest', 'cable', 'beginner', 40,
   'https://www.youtube.com/embed/Iwe6AmxVf7o', 'https://img.youtube.com/vi/Iwe6AmxVf7o/hqdefault.jpg',
   'Start low, sweep up and together toward the collarbones.'),

  -- Back
  ('close-grip-lat-pulldown', 'Close-grip lat pulldown', 'back', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/apzFTbsm7HU', 'https://img.youtube.com/vi/apzFTbsm7HU/hqdefault.jpg',
   'Neutral or close grip, pull to upper chest, elbows close to the ribs.'),
  ('reverse-grip-lat-pulldown', 'Reverse-grip lat pulldown', 'back', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/apzFTbsm7HU', 'https://img.youtube.com/vi/apzFTbsm7HU/hqdefault.jpg',
   'Underhand grip, pull the bar to the upper chest, keep a tall chest.'),
  ('neutral-grip-lat-pulldown', 'Neutral-grip lat pulldown', 'back', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/CAwf7n6Luuc', 'https://img.youtube.com/vi/CAwf7n6Luuc/hqdefault.jpg',
   'Palms face each other, pull elbows down, control the return.'),
  ('t-bar-row-machine', 'T-bar row machine', 'back', 'machine', 'intermediate', 45,
   'https://www.youtube.com/embed/j3Igk5nyZE4', 'https://img.youtube.com/vi/j3Igk5nyZE4/hqdefault.jpg',
   'Chest on pad or hinge still, pull toward the lower ribs, squeeze the back.'),
  ('iso-lateral-row', 'Iso-lateral row machine', 'back', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/GZbfZ033f74', 'https://img.youtube.com/vi/GZbfZ033f74/hqdefault.jpg',
   'Pull one handle at a time to the hip; avoid twisting the torso.'),
  ('high-row-machine', 'High row machine', 'back', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/GZbfZ033f74', 'https://img.youtube.com/vi/GZbfZ033f74/hqdefault.jpg',
   'Pull from a high angle toward the upper ribs, squeeze the mid-back.'),
  ('pullover-machine', 'Pullover machine', 'back', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/brhRXlOhsAM', 'https://img.youtube.com/vi/brhRXlOhsAM/hqdefault.jpg',
   'Keep a soft elbow, sweep the handles to the hips, feel the lats stretch.'),
  ('wide-grip-seated-row', 'Wide-grip seated row', 'back', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/GZbfZ033f74', 'https://img.youtube.com/vi/GZbfZ033f74/hqdefault.jpg',
   'Wide handle, pull to the chest, squeeze the shoulder blades.'),

  -- Shoulders
  ('lateral-raise-machine', 'Lateral raise machine', 'shoulders', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/3VcKaXpzqRo', 'https://img.youtube.com/vi/3VcKaXpzqRo/hqdefault.jpg',
   'Lead with elbows, stop near shoulder height, control the lower.'),
  ('smith-overhead-press', 'Smith machine overhead press', 'shoulders', 'machine', 'intermediate', 40,
   'https://www.youtube.com/embed/mASexvk7tEE', 'https://img.youtube.com/vi/mASexvk7tEE/hqdefault.jpg',
   'Press up without arching the lower back; bar path stays close.'),
  ('cable-front-raise', 'Cable front raise', 'shoulders', 'cable', 'beginner', 35,
   'https://www.youtube.com/embed/-t7fuZ0KhDA', 'https://img.youtube.com/vi/-t7fuZ0KhDA/hqdefault.jpg',
   'Raise to eye height with a soft elbow; avoid swinging the hips.'),
  ('cable-upright-row', 'Cable upright row', 'shoulders', 'cable', 'intermediate', 35,
   'https://www.youtube.com/embed/um3VVzqunPU', 'https://img.youtube.com/vi/um3VVzqunPU/hqdefault.jpg',
   'Pull elbows high and wide; stop around chest height if shoulders feel pinched.'),

  -- Arms
  ('bicep-curl-machine', 'Bicep curl machine', 'arms', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/ykJmrZ5v0Oo', 'https://img.youtube.com/vi/ykJmrZ5v0Oo/hqdefault.jpg',
   'Upper arms stay put, curl without swinging, squeeze at the top.'),
  ('assisted-dip-machine', 'Assisted dip machine', 'arms', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/sM6XUdt1rm4', 'https://img.youtube.com/vi/sM6XUdt1rm4/hqdefault.jpg',
   'Use enough assist for clean reps; lower to ~90° then press up.'),
  ('cable-rope-pushdown', 'Cable rope pushdown', 'arms', 'cable', 'beginner', 35,
   'https://www.youtube.com/embed/2-LAMcpzODU', 'https://img.youtube.com/vi/2-LAMcpzODU/hqdefault.jpg',
   'Elbows pinned, split the rope at the bottom, control the return.'),
  ('cable-hammer-curl', 'Cable hammer curl', 'arms', 'cable', 'beginner', 35,
   'https://www.youtube.com/embed/zC3nLlEvin4', 'https://img.youtube.com/vi/zC3nLlEvin4/hqdefault.jpg',
   'Neutral grip, curl without swinging, keep the wrists stacked.'),

  -- Traps
  ('shrug-machine', 'Shrug machine', 'traps', 'machine', 'beginner', 30,
   'https://www.youtube.com/embed/g6qbq4Lf1FI', 'https://img.youtube.com/vi/g6qbq4Lf1FI/hqdefault.jpg',
   'Elevate shoulders straight up, pause, lower slowly without rolling.'),
  ('smith-shrug', 'Smith machine shrug', 'traps', 'machine', 'beginner', 30,
   'https://www.youtube.com/embed/g6qbq4Lf1FI', 'https://img.youtube.com/vi/g6qbq4Lf1FI/hqdefault.jpg',
   'Stand tall under the bar, shrug up and hold, lower with control.'),

  -- Legs
  ('single-leg-press', 'Single-leg press', 'legs', 'machine', 'intermediate', 45,
   'https://www.youtube.com/embed/obqVU1u3Bfk', 'https://img.youtube.com/vi/obqVU1u3Bfk/hqdefault.jpg',
   'One foot mid-platform, press through the heel, stop short of locking the knee.'),
  ('pendulum-squat', 'Pendulum / V-squat machine', 'legs', 'machine', 'intermediate', 50,
   'https://www.youtube.com/embed/0tn5K9NlCfo', 'https://img.youtube.com/vi/0tn5K9NlCfo/hqdefault.jpg',
   'Back on the pad, sit between the hips, drive up without bouncing.'),
  ('belt-squat', 'Belt squat', 'legs', 'machine', 'intermediate', 50,
   'https://www.youtube.com/embed/MeIiIdhvXT4', 'https://img.youtube.com/vi/MeIiIdhvXT4/hqdefault.jpg',
   'Belt snug on the hips, sit deep, keep the torso upright.'),
  ('smith-rdl', 'Smith machine RDL', 'hamstrings', 'machine', 'intermediate', 50,
   'https://www.youtube.com/embed/2SHsk9AzdjA', 'https://img.youtube.com/vi/2SHsk9AzdjA/hqdefault.jpg',
   'Soft knees, push hips back, bar close to the legs, flat back.'),
  ('smith-bulgarian-split', 'Smith machine Bulgarian split', 'legs', 'machine', 'intermediate', 45,
   'https://www.youtube.com/embed/2C-uNgKwPLE', 'https://img.youtube.com/vi/2C-uNgKwPLE/hqdefault.jpg',
   'Rear foot elevated, front knee tracks mid-foot, torso tall.'),
  ('horizontal-leg-press', 'Horizontal leg press', 'legs', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/obqVU1u3Bfk', 'https://img.youtube.com/vi/obqVU1u3Bfk/hqdefault.jpg',
   'Feet mid-platform, press through heels, stop short of locking knees.'),
  ('sissy-squat-machine', 'Sissy squat machine', 'legs', 'machine', 'advanced', 40,
   'https://www.youtube.com/embed/aclHkVaku9U', 'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
   'Lean back, keep hips forward, control the knee bend.'),
  ('cable-squat', 'Cable squat', 'legs', 'cable', 'intermediate', 45,
   'https://www.youtube.com/embed/4AObAU-EcYE', 'https://img.youtube.com/vi/4AObAU-EcYE/hqdefault.jpg',
   'Hold the handle at the chest, sit between the hips, keep the cable taut.'),

  -- Hamstrings
  ('standing-leg-curl', 'Standing leg curl machine', 'hamstrings', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/Z053-kKjesQ', 'https://img.youtube.com/vi/Z053-kKjesQ/hqdefault.jpg',
   'Hips locked to the pad, curl one heel toward the glute, control the lower.'),
  ('glute-ham-developer', 'Glute-ham developer', 'hamstrings', 'machine', 'advanced', 45,
   'https://www.youtube.com/embed/FQKfr1YDhEk', 'https://img.youtube.com/vi/FQKfr1YDhEk/hqdefault.jpg',
   'Hips tall, lower slowly with the hamstrings, pull back without yanking.'),

  -- Glutes
  ('hip-thrust-machine', 'Hip thrust machine', 'glutes', 'machine', 'beginner', 45,
   'https://www.youtube.com/embed/5H916bAlTHM', 'https://img.youtube.com/vi/5H916bAlTHM/hqdefault.jpg',
   'Pad on the hip crease, drive through the heels, squeeze at the top.'),
  ('smith-hip-thrust', 'Smith machine hip thrust', 'glutes', 'machine', 'intermediate', 45,
   'https://www.youtube.com/embed/xDmFkJxPzeM', 'https://img.youtube.com/vi/xDmFkJxPzeM/hqdefault.jpg',
   'Upper back on a bench, bar on the hips, full hip extension without over-arching.'),
  ('standing-hip-abduction', 'Standing hip abduction', 'glutes', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/OjI5OpV6IWA', 'https://img.youtube.com/vi/OjI5OpV6IWA/hqdefault.jpg',
   'Stand tall, press the working leg out, keep the hips square.'),
  ('cable-hip-abduction', 'Cable hip abduction', 'glutes', 'cable', 'beginner', 35,
   'https://www.youtube.com/embed/OjI5OpV6IWA', 'https://img.youtube.com/vi/OjI5OpV6IWA/hqdefault.jpg',
   'Ankle cuff on the working leg; kick out to the side without leaning.'),

  -- Calves
  ('donkey-calf-raise', 'Donkey calf raise machine', 'calves', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/gwLzBJYoWlI', 'https://img.youtube.com/vi/gwLzBJYoWlI/hqdefault.jpg',
   'Hinge at the hips, full stretch at the bottom, squeeze at the top.'),
  ('leg-press-calf-raise', 'Leg press calf raise', 'calves', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/JbyjNymZOt0', 'https://img.youtube.com/vi/JbyjNymZOt0/hqdefault.jpg',
   'Balls of the feet on the platform, press through the toes, full stretch.'),
  ('smith-calf-raise', 'Smith machine calf raise', 'calves', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/gwLzBJYoWlI', 'https://img.youtube.com/vi/gwLzBJYoWlI/hqdefault.jpg',
   'Bar on the traps, rise onto the big toes, lower with control.'),

  -- Core
  ('captains-chair', 'Captain''s chair knee raise', 'core', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/hdng3Nm1x_E', 'https://img.youtube.com/vi/hdng3Nm1x_E/hqdefault.jpg',
   'Back on the pad, raise knees without swinging, control the descent.'),
  ('torso-rotation-machine', 'Torso rotation machine', 'core', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/ljgqer1ZpXg', 'https://img.youtube.com/vi/ljgqer1ZpXg/hqdefault.jpg',
   'Rotate through the ribs, not just the arms; keep the hips quiet.'),
  ('roman-chair-sit-up', 'Roman chair sit-up', 'core', 'machine', 'beginner', 35,
   'https://www.youtube.com/embed/CNHS2OoUi30', 'https://img.youtube.com/vi/CNHS2OoUi30/hqdefault.jpg',
   'Curl through the abs, avoid yanking the neck, control the lower.'),
  ('standing-cable-crunch', 'Standing cable crunch', 'core', 'cable', 'beginner', 35,
   'https://www.youtube.com/embed/_O1xunCfYEM', 'https://img.youtube.com/vi/_O1xunCfYEM/hqdefault.jpg',
   'Crunch ribs toward the pelvis; keep the hips quiet.'),

  -- Lower back
  ('hyperextension-45', '45-degree hyperextension', 'lower_back', 'machine', 'beginner', 40,
   'https://www.youtube.com/embed/4XLEnwUr1d8', 'https://img.youtube.com/vi/4XLEnwUr1d8/hqdefault.jpg',
   'Pad at the hip crease, extend without hyperextending the neck.'),
  ('reverse-hyperextension', 'Reverse hyperextension', 'lower_back', 'machine', 'intermediate', 40,
   'https://www.youtube.com/embed/4XLEnwUr1d8', 'https://img.youtube.com/vi/4XLEnwUr1d8/hqdefault.jpg',
   'Hips on the pad, lift the legs with control, squeeze glutes at the top.'),

  -- Cardio
  ('recumbent-bike', 'Recumbent bike', 'cardio', 'cardio_machine', 'beginner', 60,
   'https://www.youtube.com/embed/NwwDBARCGgo', 'https://img.youtube.com/vi/NwwDBARCGgo/hqdefault.jpg',
   'Seat so the knee is soft at the bottom; start easy then add resistance.'),
  ('spin-bike', 'Spin bike', 'cardio', 'cardio_machine', 'beginner', 60,
   'https://www.youtube.com/embed/NwwDBARCGgo', 'https://img.youtube.com/vi/NwwDBARCGgo/hqdefault.jpg',
   'Saddle height at hip, light hands on the bars, smooth cadence.'),
  ('jacob-ladder', 'Jacob''s ladder', 'cardio', 'cardio_machine', 'intermediate', 50,
   'https://www.youtube.com/embed/M4j_vJlfZvs', 'https://img.youtube.com/vi/M4j_vJlfZvs/hqdefault.jpg',
   'Climb with opposite arm and leg, stay tall, keep a steady rhythm.'),
  ('arm-ergometer', 'Arm ergometer', 'cardio', 'cardio_machine', 'beginner', 50,
   'https://www.youtube.com/embed/M4j_vJlfZvs', 'https://img.youtube.com/vi/M4j_vJlfZvs/hqdefault.jpg',
   'Sit tall, circle the handles smoothly, keep the shoulders down.'),
  ('recumbent-stepper', 'Recumbent stepper', 'cardio', 'cardio_machine', 'beginner', 60,
   'https://www.youtube.com/embed/M4j_vJlfZvs', 'https://img.youtube.com/vi/M4j_vJlfZvs/hqdefault.jpg',
   'Back on the pad, full foot on each pedal, easy even pace.')
on conflict (slug) do update set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  difficulty = excluded.difficulty,
  duration_seconds = excluded.duration_seconds,
  demo_video_url = excluded.demo_video_url,
  demo_thumbnail_url = excluded.demo_thumbnail_url,
  cues = excluded.cues;
