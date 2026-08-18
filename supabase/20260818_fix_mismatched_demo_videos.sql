-- Replace clips where the named machine/move is not in the video.

update public.gym_exercises as g
set demo_video_url = v.demo_video_url
from (
  values
    ('inverted-row', 'https://www.youtube.com/embed/Fl0UMfdEzsE'),
    ('cable-bicep-curl', 'https://www.youtube.com/embed/NFzTWp2qpiE'),
    ('cable-overhead-extension', 'https://www.youtube.com/embed/8WC7rIOkhi0'),
    ('cable-pull-through', 'https://www.youtube.com/embed/4oZ_0_bQcOg'),
    ('belt-squat', 'https://www.youtube.com/embed/5V4-VKER95o'),
    ('pendulum-squat', 'https://www.youtube.com/embed/lYoYwBYU3tQ'),
    ('lateral-raise-machine', 'https://www.youtube.com/embed/N7iyBxXATpo'),
    ('chest-supported-row', 'https://www.youtube.com/embed/FTwvmczf7bE'),
    ('iso-lateral-row', 'https://www.youtube.com/embed/FTwvmczf7bE'),
    ('high-row-machine', 'https://www.youtube.com/embed/ci61zln1hRY'),
    ('rear-delt-fly-machine', 'https://www.youtube.com/embed/Y7ZKBP5bMwg'),
    ('glute-ham-developer', 'https://www.youtube.com/embed/RtwVVDS3vAM'),
    ('jacob-ladder', 'https://www.youtube.com/embed/rNZvCVqnO30'),
    ('smith-bench-press', 'https://www.youtube.com/embed/7FyJdsXeta8'),
    ('cable-lateral-raise', 'https://www.youtube.com/embed/tf3PNHeeWCQ'),
    ('pullover-machine', 'https://www.youtube.com/embed/QG4k1Mha4vQ'),
    ('seated-dip-machine', 'https://www.youtube.com/embed/EBnq0A5L_wo'),
    ('recumbent-stepper', 'https://www.youtube.com/embed/kgKauTySM7I'),
    ('roman-chair-sit-up', 'https://www.youtube.com/embed/fALiL-cBZjY')
) as v(slug, demo_video_url)
where g.slug = v.slug;
