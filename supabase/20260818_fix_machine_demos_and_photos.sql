-- Fix mismatched gym demos (clip must show the named machine/move)
-- and replace YouTube thumbnails with photos of the actual equipment.

update public.gym_exercises as g
set
  demo_video_url = v.demo_video_url,
  demo_thumbnail_url = v.demo_thumbnail_url
from (
  values
    -- Chest machines
    ('chest-press-machine', 'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bench_press_Machine.jpg/960px-Bench_press_Machine.jpg'),
    ('incline-chest-press-machine', 'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bench_press_Machine.jpg/960px-Bench_press_Machine.jpg'),
    ('decline-chest-press-machine', 'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bench_press_Machine.jpg/960px-Bench_press_Machine.jpg'),
    ('iso-lateral-chest-press', 'https://www.youtube.com/embed/xUm0BiZCWlQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bench_press_Machine.jpg/960px-Bench_press_Machine.jpg'),
    ('pec-deck', 'https://www.youtube.com/embed/wsNAD1BpiaE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Chest_Fly_Machine.jpg/960px-Chest_Fly_Machine.jpg'),
    ('seated-dip-machine', 'https://www.youtube.com/embed/D4qhgWBUL4M', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dip_and_pull-up_machine.jpg/960px-Dip_and_pull-up_machine.jpg'),
    ('smith-bench-press', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),

    -- Back machines
    ('lat-pulldown', 'https://www.youtube.com/embed/CAwf7n6Luuc', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lat_pulldown_machine_20180112.jpg/960px-Lat_pulldown_machine_20180112.jpg'),
    ('close-grip-lat-pulldown', 'https://www.youtube.com/embed/CAwf7n6Luuc', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lat_pulldown_machine_20180112.jpg/960px-Lat_pulldown_machine_20180112.jpg'),
    ('neutral-grip-lat-pulldown', 'https://www.youtube.com/embed/CAwf7n6Luuc', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lat_pulldown_machine_20180112.jpg/960px-Lat_pulldown_machine_20180112.jpg'),
    ('reverse-grip-lat-pulldown', 'https://www.youtube.com/embed/apzFTbsm7HU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lat_pulldown_machine_20180112.jpg/960px-Lat_pulldown_machine_20180112.jpg'),
    ('assisted-pullup', 'https://www.youtube.com/embed/D4qhgWBUL4M', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dip_and_pull-up_machine.jpg/960px-Dip_and_pull-up_machine.jpg'),
    ('t-bar-row-machine', 'https://www.youtube.com/embed/j3Igk5nyZE4', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('chest-supported-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('iso-lateral-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('high-row-machine', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('wide-grip-seated-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('pullover-machine', 'https://www.youtube.com/embed/L9Aav-0_pg0', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lat_pulldown_machine_20180112.jpg/960px-Lat_pulldown_machine_20180112.jpg'),

    -- Shoulders / traps machines
    ('shoulder-press-machine', 'https://www.youtube.com/embed/mASexvk7tEE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bench_press_Machine.jpg/960px-Bench_press_Machine.jpg'),
    ('smith-overhead-press', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('lateral-raise-machine', 'https://www.youtube.com/embed/3VcKaXpzqRo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Chest_Fly_Machine_1.jpg/960px-Chest_Fly_Machine_1.jpg'),
    ('rear-delt-fly-machine', 'https://www.youtube.com/embed/wsNAD1BpiaE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Chest_Fly_Machine_1.jpg/960px-Chest_Fly_Machine_1.jpg'),
    ('shrug-machine', 'https://www.youtube.com/embed/g6qbq4Lf1FI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('smith-shrug', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),

    -- Arms machines
    ('bicep-curl-machine', 'https://www.youtube.com/embed/M_uPvGrMx_o', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('preacher-curl-machine', 'https://www.youtube.com/embed/M_uPvGrMx_o', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('tricep-extension-machine', 'https://www.youtube.com/embed/2-LAMcpzODU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('assisted-dip-machine', 'https://www.youtube.com/embed/D4qhgWBUL4M', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dip_and_pull-up_machine.jpg/960px-Dip_and_pull-up_machine.jpg'),

    -- Legs / glutes / hamstrings machines
    ('leg-press', 'https://www.youtube.com/embed/obqVU1u3Bfk', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Leg_press_machine.jpg/960px-Leg_press_machine.jpg'),
    ('horizontal-leg-press', 'https://www.youtube.com/embed/IZxyjW7MPJQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Leg_press_machine.jpg/960px-Leg_press_machine.jpg'),
    ('single-leg-press', 'https://www.youtube.com/embed/obqVU1u3Bfk', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Leg_press_machine.jpg/960px-Leg_press_machine.jpg'),
    ('hack-squat', 'https://www.youtube.com/embed/0tn5K9NlCfo', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/HackSquatMachineExercise.JPG'),
    ('pendulum-squat', 'https://www.youtube.com/embed/0tn5K9NlCfo', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/HackSquatMachineExercise.JPG'),
    ('belt-squat', 'https://www.youtube.com/embed/0tn5K9NlCfo', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/HackSquatMachineExercise.JPG'),
    ('sissy-squat-machine', 'https://www.youtube.com/embed/aclHkVaku9U', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Sissy_squat_machine.jpg/960px-Sissy_squat_machine.jpg'),
    ('leg-extension', 'https://www.youtube.com/embed/YyvSfVjQeL0', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Leg_extender_machine.jpg/960px-Leg_extender_machine.jpg'),
    ('leg-curl-machine', 'https://www.youtube.com/embed/1Tq3QdYUuHs', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('seated-leg-curl', 'https://www.youtube.com/embed/ELOCsoDSmrg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('standing-leg-curl', 'https://www.youtube.com/embed/Z053-kKjesQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('smith-squat', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('smith-rdl', 'https://www.youtube.com/embed/2SHsk9AzdjA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('smith-bulgarian-split', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('smith-reverse-lunge', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('hip-abductor', 'https://www.youtube.com/embed/OjI5OpV6IWA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hip_abductor_machine.jpg/960px-Hip_abductor_machine.jpg'),
    ('hip-adductor', 'https://www.youtube.com/embed/iYcS9jCA6gE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hip_abductor_machine.jpg/960px-Hip_abductor_machine.jpg'),
    ('standing-hip-abduction', 'https://www.youtube.com/embed/OjI5OpV6IWA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hip_abductor_machine.jpg/960px-Hip_abductor_machine.jpg'),
    ('hip-thrust-machine', 'https://www.youtube.com/embed/5H916bAlTHM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Incline_bench.jpg/960px-Incline_bench.jpg'),
    ('smith-hip-thrust', 'https://www.youtube.com/embed/xDmFkJxPzeM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),
    ('glute-kickback-machine', 'https://www.youtube.com/embed/Wfu9ZNc5kTI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('glute-ham-developer', 'https://www.youtube.com/embed/w5QPcMaT_DQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hyper_bench.jpg/960px-Hyper_bench.jpg'),

    -- Calves
    ('seated-calf-machine', 'https://www.youtube.com/embed/JbyjNymZOt0', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Seated_calf_machine.jpg/960px-Seated_calf_machine.jpg'),
    ('calf-raise-machine', 'https://www.youtube.com/embed/gwLzBJYoWlI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Seated_calf_machine.jpg/960px-Seated_calf_machine.jpg'),
    ('donkey-calf-raise', 'https://www.youtube.com/embed/gwLzBJYoWlI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Seated_calf_machine.jpg/960px-Seated_calf_machine.jpg'),
    ('leg-press-calf-raise', 'https://www.youtube.com/embed/obqVU1u3Bfk', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Leg_press_machine.jpg/960px-Leg_press_machine.jpg'),
    ('smith-calf-raise', 'https://www.youtube.com/embed/AHnX-aimA4E', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Smith_machine.webp/640px-Smith_machine.webp.png'),

    -- Core / lower back machines
    ('ab-crunch-machine', 'https://www.youtube.com/embed/CNHS2OoUi30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('captains-chair', 'https://www.youtube.com/embed/RD_A-Z15ER4', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Dip_and_pull-up_machine.jpg/960px-Dip_and_pull-up_machine.jpg'),
    ('roman-chair-sit-up', 'https://www.youtube.com/embed/w5QPcMaT_DQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hyper_bench.jpg/960px-Hyper_bench.jpg'),
    ('torso-rotation-machine', 'https://www.youtube.com/embed/oL7exAOo_0I', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('hyperextension-45', 'https://www.youtube.com/embed/w5QPcMaT_DQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hyper_bench.jpg/960px-Hyper_bench.jpg'),
    ('back-extension-machine', 'https://www.youtube.com/embed/w5QPcMaT_DQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hyper_bench.jpg/960px-Hyper_bench.jpg'),
    ('reverse-hyperextension', 'https://www.youtube.com/embed/X1cvGsxbqOE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hyper_bench.jpg/960px-Hyper_bench.jpg'),

    -- Cardio machines
    ('treadmill-intervals', 'https://www.youtube.com/embed/8i3Vrd95o2k', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Treadmill_from_Viking_Sport%2C_front.jpg/960px-Treadmill_from_Viking_Sport%2C_front.jpg'),
    ('elliptical', 'https://www.youtube.com/embed/M4j_vJlfZvs', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Elliptical_machine.jpg/960px-Elliptical_machine.jpg'),
    ('rowing-machine', 'https://www.youtube.com/embed/6_eLpWiNijE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Rowing_machine.jpg/960px-Rowing_machine.jpg'),
    ('ski-erg', 'https://www.youtube.com/embed/B0lIgT5PHc8', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Rowing_machine.jpg/960px-Rowing_machine.jpg'),
    ('assault-bike', 'https://www.youtube.com/embed/K1qirq3eKPk', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/13-01-04-tunturi-by-RalfR-01.jpg/960px-13-01-04-tunturi-by-RalfR-01.jpg'),
    ('stair-climber', 'https://www.youtube.com/embed/SZU9Rm0sNOo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('stationary-bike', 'https://www.youtube.com/embed/NwwDBARCGgo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/13-01-04-tunturi-by-RalfR-01.jpg/960px-13-01-04-tunturi-by-RalfR-01.jpg'),
    ('recumbent-bike', 'https://www.youtube.com/embed/un7rqkJ8ceM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/13-01-04-tunturi-by-RalfR-01.jpg/960px-13-01-04-tunturi-by-RalfR-01.jpg'),
    ('spin-bike', 'https://www.youtube.com/embed/ywMT-KyQRd4', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/13-01-04-tunturi-by-RalfR-01.jpg/960px-13-01-04-tunturi-by-RalfR-01.jpg'),
    ('jacob-ladder', 'https://www.youtube.com/embed/SZU9Rm0sNOo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Exercise_machines_at_gym.jpg/960px-Exercise_machines_at_gym.jpg'),
    ('arm-ergometer', 'https://www.youtube.com/embed/B0lIgT5PHc8', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Rowing_machine.jpg/960px-Rowing_machine.jpg'),
    ('recumbent-stepper', 'https://www.youtube.com/embed/un7rqkJ8ceM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Elliptical_machine.jpg/960px-Elliptical_machine.jpg'),

    -- Cables (photo = dual cable station; clip matches the move)
    ('seated-cable-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('single-arm-cable-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('straight-arm-pulldown', 'https://www.youtube.com/embed/L9Aav-0_pg0', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-crossover', 'https://www.youtube.com/embed/Iwe6AmxVf7o', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-fly-high-to-low', 'https://www.youtube.com/embed/Iwe6AmxVf7o', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-fly-low-to-high', 'https://www.youtube.com/embed/eQ_NBB6OBH4', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-tricep-pushdown', 'https://www.youtube.com/embed/2-LAMcpzODU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-rope-pushdown', 'https://www.youtube.com/embed/2-LAMcpzODU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-overhead-extension', 'https://www.youtube.com/embed/2-LAMcpzODU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-bicep-curl', 'https://www.youtube.com/embed/M_uPvGrMx_o', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-hammer-curl', 'https://www.youtube.com/embed/zC3nLlEvin4', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-face-pull', 'https://www.youtube.com/embed/ljgqer1ZpXg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('band-face-pull', 'https://www.youtube.com/embed/ljgqer1ZpXg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-front-raise', 'https://www.youtube.com/embed/-t7fuZ0KhDA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-lateral-raise', 'https://www.youtube.com/embed/3VcKaXpzqRo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-rear-delt-fly', 'https://www.youtube.com/embed/wsNAD1BpiaE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-upright-row', 'https://www.youtube.com/embed/um3VVzqunPU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-shrug', 'https://www.youtube.com/embed/cJRVVxmytaM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-crunch', 'https://www.youtube.com/embed/_O1xunCfYEM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('standing-cable-crunch', 'https://www.youtube.com/embed/_O1xunCfYEM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-woodchop', 'https://www.youtube.com/embed/oL7exAOo_0I', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('pallof-press', 'https://www.youtube.com/embed/ma2OjgP5XDc', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-kickback', 'https://www.youtube.com/embed/Wfu9ZNc5kTI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-hip-abduction', 'https://www.youtube.com/embed/SIQrpq6YnT8', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-hip-adduction', 'https://www.youtube.com/embed/SIQrpq6YnT8', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-pull-through', 'https://www.youtube.com/embed/4AObAU-EcYE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),
    ('cable-squat', 'https://www.youtube.com/embed/aclHkVaku9U', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg/960px-Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg'),

    -- Free-weight / bodyweight clips that were clearly the wrong movement
    ('box-jump', 'https://www.youtube.com/embed/hxldG9FX4j4', 'https://img.youtube.com/vi/hxldG9FX4j4/hqdefault.jpg'),
    ('battle-ropes', 'https://www.youtube.com/embed/CzxBf5jM3M4', 'https://img.youtube.com/vi/CzxBf5jM3M4/hqdefault.jpg'),
    ('dead-hang', 'https://www.youtube.com/embed/eGo4IYlbE5g', 'https://img.youtube.com/vi/eGo4IYlbE5g/hqdefault.jpg'),
    ('inverted-row', 'https://www.youtube.com/embed/GZbfZ033f74', 'https://img.youtube.com/vi/GZbfZ033f74/hqdefault.jpg')
) as v(slug, demo_video_url, demo_thumbnail_url)
where g.slug = v.slug;
