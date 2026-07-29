const candidates = {
  "ab-crunch-machine": ["9FGilxCbdz8", "wkD8rjkodUI", "ASdvN_XEl_c"],
  "ankle-rocks": ["Gs4AyvJpG1M", "OGcBM75aE7Q", "YQmpO9VT2X4", "kqnua4rHVVA"],
  "back-extension-machine": ["phBQFXhnyYc", "4XLEnwUr1d8", "ASdvN_XEl_c", "CAwf7n6Luuc"],
  "bench-dip": ["c3ZGl4pAwZ4", "6SS6K3lAwZ8", "2-LAMcpzODU", "IODxDxX7oi4"],
  "bird-dog": ["wi2jAt77SHs", "4XLEnwUr1d8", "ASdvN_XEl_c", "OUgsJ8-Vi0E"],
  "box-jump": ["52vDQTB-X7E", "NBYRt-kKOUo", "wS4OsJ4yzx4", "nmwgirgXLYM"],
  "cable-crunch": ["2y1N_s8rP4A", "9FGilxCbdz8", "wkD8rjkodUI", "ASdvN_XEl_c"],
  "cable-pull-through": ["4AObAU-EcYE", "xDmFkJxPzeM", "OUgsJ8-Vi0E", "FQKfr1YDhEk"],
  "cable-woodchop": ["pAplQXk3Mks", "ljgqer1ZpXg", "3VcKaXpzqRo", "wkD8rjkodUI"],
  "clamshell": ["TnN8VNTFvcY", "KZzG-b_E9I0", "OUgsJ8-Vi0E", "lhwT35sshrI"],
  "dumbbell-step-up": ["dQqApCGd5Zc", "2C-uNgKwPLE", "L8fvypPrzzs", "MeIiIdhvXT4"],
  thruster: ["L219ltLXVKw", "qEwKCR5JCog", "MeIiIdhvXT4", "6Z15_WdXmVw"],
  "farmer-carry": ["Fkzk_RqlYig", "p5MNNofen7s", "cJRVVxmytaM", "g6qbq4Lf1FI"],
  "farmers-hold": ["Fkzk_RqlYig", "cJRVVxmytaM", "g6qbq4Lf1FI", "zC3nLlEvin4"],
  "fire-hydrant": ["Z21XsmmjzHk", "OUgsJ8-Vi0E", "lhwT35sshrI", "OjI5OpV6IWA"],
  "glute-kickback-machine": ["SEdqd1n0cvg", "OjI5OpV6IWA", "xDmFkJxPzeM", "OUgsJ8-Vi0E"],
  "good-morning": ["5uIcXHzV7NM", "FQKfr1YDhEk", "jEy_czb3RKA", "DGavj41F_Cs"],
  "high-knees": ["8opcQdC-V-U", "iSSAk4XCsRA", "nmwgirgXLYM", "wS4OsJ4yzx4"],
  "incline-push-up": ["cfZsML4CKcA", "IODxDxX7oi4", "J0DnG1_S92I", "VmB1G1K7v94"],
  "jump-rope": ["1BZM2Vre5ac", "iSSAk4XCsRA", "nmwgirgXLYM", "wS4OsJ4yzx4"],
  "kettlebell-swing": ["YPisLRLbZmA", "FQKfr1YDhEk", "jEy_czb3RKA", "OUgsJ8-Vi0E"],
  "thoracic-rotation": ["0e9J0oXQy8A", "kqnua4rHVVA", "_ZX_zTOBgp8", "YQmpO9VT2X4"],
  "pike-push-up": ["xuthWQetxbE", "IODxDxX7oi4", "qEwKCR5JCog", "J0DnG1_S92I"],
  "preacher-curl-machine": ["fopTZGqxvoM", "ykJmrZ5v0Oo", "zC3nLlEvin4", "2-LAMcpzODU"],
  "rear-delt-fly-machine": ["9nhg_sZ7D3A", "PpTFvRTYfpw", "ljgqer1ZpXg", "3VcKaXpzqRo"],
  "reverse-crunch": ["HyvFqW9CYvQ", "9FGilxCbdz8", "wkD8rjkodUI", "ASdvN_XEl_c"],
  "reverse-wrist-curl": ["iQJDbWvb8s8", "ykJmrZ5v0Oo", "zC3nLlEvin4", "cJRVVxmytaM"],
  "rowing-machine": ["zQ82RYZFKg8", "FWP9hK0bFhQ", "GZbfZ033f74", "M4j_vJlfZvs"],
  "ski-erg": ["oTZX-F3gMxA", "M4j_vJlfZvs", "NwwDBARCGgo", "8i3Vrd95o2k"],
  "stair-climber": ["aU4pyiB_oqI", "M4j_vJlfZvs", "NwwDBARCGgo", "8i3Vrd95o2k"],
  "standing-calf-raise": ["-M4-amot7hQ", "JbyjNymZOt0", "gwLzBJYoWlI", "aclHkVaku9U"],
  "superman-hold": ["z6PJMBJjf04", "4XLEnwUr1d8", "ASdvN_XEl_c", "OUgsJ8-Vi0E"],
  "thread-the-needle": ["2vFK0i0p3oQ", "kqnua4rHVVA", "_ZX_zTOBgp8", "YQmpO9VT2X4"],
  "tricep-extension-machine": ["2-LaADo_QT4", "2-LAMcpzODU", "6SS6K3lAwZ8", "ykJmrZ5v0Oo"],
  "wall-sit": ["y-wV4VenusQ", "aclHkVaku9U", "MeIiIdhvXT4", "L8fvypPrzzs"],
  "worlds-greatest-stretch": ["bh5m_vMVbXo", "kqnua4rHVVA", "YQmpO9VT2X4", "_ZX_zTOBgp8"],
  "wrist-curl": ["3Pz4yEo0xDY", "ykJmrZ5v0Oo", "zC3nLlEvin4", "cJRVVxmytaM"],
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

const fs = await import("node:fs");
fs.writeFileSync(
  "scripts/gym-video-replacements.json",
  JSON.stringify(picked, null, 2),
);
console.log("Wrote scripts/gym-video-replacements.json");
