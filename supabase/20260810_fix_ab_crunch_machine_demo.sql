-- Point ab crunch machine (and related mis-mapped crunch demos) at working YouTube embeds.

update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/CNHS2OoUi30',
  demo_thumbnail_url = 'https://img.youtube.com/vi/CNHS2OoUi30/hqdefault.jpg'
where slug = 'ab-crunch-machine';

update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/_O1xunCfYEM',
  demo_thumbnail_url = 'https://img.youtube.com/vi/_O1xunCfYEM/hqdefault.jpg'
where slug = 'cable-crunch'
  and demo_video_url like '%9FGilxCbdz8%';

-- Keep bicycle crunch on the bicycle how-to; reverse / toe-touch get a closer ab demo.
update public.gym_exercises
set
  demo_video_url = 'https://www.youtube.com/embed/wkD8rjkodUI',
  demo_thumbnail_url = 'https://img.youtube.com/vi/wkD8rjkodUI/hqdefault.jpg'
where slug in ('reverse-crunch', 'toe-touch-crunch')
  and demo_video_url like '%9FGilxCbdz8%';
