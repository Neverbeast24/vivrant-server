import fs from "node:fs";

const map = JSON.parse(fs.readFileSync("scripts/gym-video-replacements.json", "utf8"));
let sql = fs.readFileSync("supabase/20260722_expand_gym_demo_library.sql", "utf8");

const pairs = [
  ["Xyd_fa5zoUA", map["ab-crunch-machine"]],
  ["eP8yF5n3m0A", map["ankle-rocks"]],
  ["ph3pddpKdq0", map["back-extension-machine"]],
  ["0326dytygHc", map["bench-dip"]],
  ["wi_e0AD0TuQ", map["bird-dog"]],
  ["NBYRt-kKOUo", map["box-jump"]],
  ["ToJeyCrvVb0", map["cable-crunch"]],
  ["3XjJ2sD-f1g", map["cable-pull-through"]],
  ["pAplQXk3Mks", map["cable-woodchop"]],
  ["KZzG-b_E9I0", map["clamshell"]],
  ["dQqApCGd5Zc", map["dumbbell-step-up"]],
  ["L219ltLXVKw", map["thruster"]],
  ["p5MNNofen7s", map["farmer-carry"]],
  ["Z21XsmmjzHk", map["fire-hydrant"]],
  ["SaS3i1kG9sU", map["glute-kickback-machine"]],
  ["5uIcXHzV7NM", map["good-morning"]],
  ["8opcQdC-V-U", map["high-knees"]],
  ["cfZsML4CKcA", map["incline-push-up"]],
  ["1BZM2Vre5ac", map["jump-rope"]],
  ["YPisLRLbZmA", map["kettlebell-swing"]],
  ["0e9J0oXQy8A", map["thoracic-rotation"]],
  ["xuthWQetxbE", map["pike-push-up"]],
  ["fopTZGqxvoM", map["preacher-curl-machine"]],
  ["9nhg_sZ7D3A", map["rear-delt-fly-machine"]],
  ["HyvFqW9CYvQ", map["reverse-crunch"]],
  ["iQJDbWvb8s8", map["reverse-wrist-curl"]],
  ["FWP9hK0bFhQ", map["rowing-machine"]],
  ["oTZX-F3gMxA", map["ski-erg"]],
  ["aU4pyiB_oqI", map["stair-climber"]],
  ["-M4-amot7hQ", map["standing-calf-raise"]],
  ["z6PJMBJjf04", map["superman-hold"]],
  ["2vFK0i0p3oQ", map["thread-the-needle"]],
  ["2-LaADo_QT4", map["tricep-extension-machine"]],
  ["y-wV4VenusQ", map["wall-sit"]],
  ["bh5m_vMVbXo", map["worlds-greatest-stretch"]],
  ["3Pz4yEo0xDY", map["wrist-curl"]],
];

let n = 0;
for (const [oldId, newId] of pairs) {
  if (!newId) continue;
  const count = sql.split(oldId).length - 1;
  if (count > 0) {
    sql = sql.split(oldId).join(newId);
    n += count;
  }
}

fs.writeFileSync("supabase/20260722_expand_gym_demo_library.sql", sql);
console.log("replacements", n);
