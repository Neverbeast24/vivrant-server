import fs from "node:fs";

const candidates = {
  "decline-dumbbell-press": ["LfyQUNYWXkA", "8iPEnn-ltC8", "VmB1G1K7v94"],
  "cable-crossover": ["taDP9q8sgpA", "8iPEnn-ltC8", "3VcKaXpzqRo"],
  "landmine-press": ["WqvMxd99znM", "6Z15_WdXmVw", "qEwKCR5JCog"],
  "t-bar-row": ["j3Igkv5hBAc", "FWJR5Ve8bnQ", "GZbfZ033f74"],
  "straight-arm-pulldown": ["kiu8iIIXh0A", "brhRXlOhsAM", "GZbfZ033f74"],
  "inverted-row": ["hXTc1mDnRiY", "brhRXlOhsAM", "IODxDxX7oi4"],
  "single-arm-cable-row": ["GZbfZ033f74", "FWJR5Ve8bnQ", "ljgqer1ZpXg"],
  "military-press": ["2yjwXTZQDDI", "6Z15_WdXmVw", "qEwKCR5JCog"],
  "dumbbell-rear-delt-raise": ["ppgudH_R3fc", "PpTFvRTYfpw", "3VcKaXpzqRo"],
  "cable-rear-delt-fly": ["ppgudH_R3fc", "PpTFvRTYfpw", "ljgqer1ZpXg"],
  "ez-bar-curl": ["zC3nLlEvin4", "ykJmrZ5v0Oo", "2-LAMcpzODU"],
  "overhead-tricep-extension": ["YbX7Wd8jQ1g", "2-LAMcpzODU", "6SS6K3lAwZ8"],
  "cable-overhead-extension": ["2-LAMcpzODU", "ykJmrZ5v0Oo", "6SS6K3lAwZ8"],
  "incline-curl": ["ykJmrZ5v0Oo", "zC3nLlEvin4", "cJRVVxmytaM"],
  "front-squat": ["uYumuL_Gk9A", "aclHkVaku9U", "2C-uNgKwPLE"],
  "goblet-reverse-lunge": ["L8fvypPrzzs", "2C-uNgKwPLE", "MeIiIdhvXT4"],
  "nordic-curl": ["dIKeR_Td9eI", "FQKfr1YDhEk", "jEy_czb3RKA"],
  "seated-leg-curl": ["Orxym69o1Ww", "aclHkVaku9U", "JbyjNymZOt0"],
  "frog-pump": ["SJ1Xuz9D-ZQ", "OUgsJ8-Vi0E", "xDmFkJxPzeM"],
  "banded-side-step": ["OUgsJ8-Vi0E", "lhwT35sshrI", "TnN8VNTFvcY"],
  "single-leg-glute-bridge": ["SJ1Xuz9D-ZQ", "OUgsJ8-Vi0E", "xDmFkJxPzeM"],
  "ab-wheel-rollout": ["9FGilxCbdz8", "wkD8rjkodUI", "ASdvN_XEl_c"],
  "v-up": ["iP2fjvGTgps", "9FGilxCbdz8", "wkD8rjkodUI"],
  "toe-touch-crunch": ["9FGilxCbdz8", "wkD8rjkodUI", "HyvFqW9CYvQ"],
  "hanging-leg-raise": ["RD_A-Z15ER4", "9FGilxCbdz8", "wkD8rjkodUI"],
  "battle-ropes": ["wS4OsJ4yzx4", "iSSAk4XCsRA", "nmwgirgXLYM"],
  "assault-bike": ["M4j_vJlfZvs", "GZbfZ033f74", "NwwDBARCGgo"],
  "shadow-boxing": ["iSSAk4XCsRA", "nmwgirgXLYM", "wS4OsJ4yzx4"],
  "pigeon-pose": ["kqnua4rHVVA", "YQmpO9VT2X4", "_ZX_zTOBgp8"],
  "ninety-ninety-stretch": ["kqnua4rHVVA", "YQmpO9VT2X4", "OUgsJ8-Vi0E"],
  "foam-roll-quads": ["kqnua4rHVVA", "Gs4AyvJpG1M", "YQmpO9VT2X4"],
  "band-face-pull": ["ljgqer1ZpXg", "PpTFvRTYfpw", "3VcKaXpzqRo"],
  "plate-pinch": ["Fkzk_RqlYig", "cJRVVxmytaM", "ykJmrZ5v0Oo"],
  "dead-hang": ["brhRXlOhsAM", "RD_A-Z15ER4", "Fkzk_RqlYig"],
  "dumbbell-pullover": ["FKRxZcub5kw", "8iPEnn-ltC8", "FWJR5Ve8bnQ"],
  "sissy-squat": ["aclHkVaku9U", "2C-uNgKwPLE", "L8fvypPrzzs"],
  "cable-shrug": ["cJRVVxmytaM", "g6qbq4Lf1FI", "um3VVzqunPU"],
  "trap-bar-deadlift": ["op9kVnSso6Q", "3XDriUn0udo", "FQKfr1YDhEk"],
  "walking-farmer-carry": ["Fkzk_RqlYig", "cJRVVxmytaM", "p5MNNofen7s"],
  "medicine-ball-slam": ["wS4OsJ4yzx4", "qEwKCR5JCog", "iSSAk4XCsRA"],
};

async function ok(id) {
  try {
    const res = await fetch(
      "https://www.youtube.com/oembed?url=" +
        encodeURIComponent("https://www.youtube.com/watch?v=" + id) +
        "&format=json",
    );
    return res.ok;
  } catch {
    return false;
  }
}

const picked = {};
for (const [slug, ids] of Object.entries(candidates)) {
  let found = null;
  for (const id of ids) {
    if (await ok(id)) {
      found = id;
      break;
    }
  }
  picked[slug] = found;
  console.log(slug + "\t" + (found || "NONE"));
}

fs.writeFileSync(
  "scripts/new-gym-video-picks.json",
  JSON.stringify(picked, null, 2),
);
console.log("Wrote scripts/new-gym-video-picks.json");
