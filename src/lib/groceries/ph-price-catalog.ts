/** Philippine calendar helpers + dynamic grocery pricing (₱). */

export const PH_TIMEZONE = "Asia/Manila";

/** Catalog unit prices are calibrated to this PH year (approx. mid-market). */
export const PRICE_BASE_YEAR = 2025;

/** Soft annual food inflation used to roll catalog forward by calendar year. */
export const ANNUAL_FOOD_INFLATION = 0.04;

export type PhCalendarDate = {
  year: number;
  month: number; // 1–12
  day: number;
  isoDate: string; // YYYY-MM-DD
  monthStart: string; // YYYY-MM-01
  monthLabel: string; // e.g. July 2026
};

export function getPhCalendarDate(now: Date = new Date()): PhCalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: PH_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(now);

  return { year, month, day, isoDate, monthStart, monthLabel };
}

/** Typical Philippine supermarket / wet-market unit prices in PHP (base year). */
export const PH_GROCERY_PRICE_CATALOG: Record<string, number> = {
  // produce — per piece / small pack unless noted
  apple: 35,
  apples: 180,
  "green apple": 40,
  "green apples": 200,
  banana: 8,
  bananas: 70,
  "saba banana": 60,
  mango: 45,
  "carabao mango": 55,
  tomato: 15,
  tomatoes: 70,
  onion: 20,
  onions: 65,
  "red onion": 70,
  garlic: 25,
  potato: 25,
  potatoes: 85,
  carrot: 20,
  carrots: 65,
  cabbage: 45,
  lettuce: 55,
  cucumber: 20,
  eggplant: 25,
  kangkong: 15,
  pechay: 20,
  calamansi: 25,
  lemon: 40,
  orange: 35,
  papaya: 55,
  ginger: 30,
  "green beans": 55,
  "bell pepper": 45,
  spinach: 45,
  broccoli: 95,
  avocado: 70,
  corn: 25,
  squash: 40,
  "sayote": 30,
  "ampalaya": 35,
  "sitaw": 40,
  "okoy": 50,

  // protein — per pack / kg-ish retail unit
  chicken: 185,
  "whole chicken": 220,
  "chicken breast": 230,
  "chicken thighs": 195,
  "chicken wings": 210,
  egg: 9,
  eggs: 85,
  "egg tray": 270,
  tuna: 48,
  "canned tuna": 48,
  bangus: 165,
  tilapia: 145,
  galunggong: 125,
  pork: 290,
  "ground pork": 270,
  "pork belly": 340,
  beef: 390,
  "ground beef": 360,
  "beef chuck": 380,
  tofu: 35,
  tokwa: 30,
  "fish fillet": 210,
  shrimp: 330,
  "sardines can": 28,
  hotdog: 85,
  hotdogs: 85,
  "hot dog": 85,
  "purefoods hotdog": 95,
  "tender juicy": 110,
  longganisa: 120,
  tocino: 130,
  bacon: 160,
  "canned meat": 60,
  spam: 180,
  corned: 55,
  "corned beef": 55,

  // dairy
  milk: 98,
  "fresh milk": 98,
  "oat milk": 125,
  oatside: 115,
  "oatside barista": 130,
  yogurt: 58,
  cheese: 95,
  "cheese singles": 90,
  butter: 88,
  "evaporated milk": 48,
  "condensed milk": 52,
  "nestle milk": 100,

  // grains
  rice: 58,
  "rice 1kg": 58,
  "rice 5kg": 280,
  "brown rice": 88,
  quinoa: 185,
  oats: 98,
  "quaker oats": 110,
  bread: 68,
  pandesal: 35,
  "whole wheat bread": 88,
  pasta: 58,
  noodles: 22,
  "pancit canton": 18,
  "instant noodles": 18,
  "lucky me": 16,
  flour: 55,
  "corn flakes": 125,

  // pantry
  oil: 95,
  "cooking oil": 95,
  "olive oil": 230,
  soy: 38,
  "soy sauce": 38,
  vinegar: 32,
  salt: 22,
  sugar: 68,
  "brown sugar": 72,
  pepper: 38,
  "tomato sauce": 38,
  "coconut milk": 48,
  "gata": 48,
  peanut: 85,
  "peanut butter": 125,
  honey: 155,
  "canned beans": 48,
  sardines: 28,
  "luncheon meat": 58,
  mayonnaise: 95,
  ketchup: 55,
  "magic sarap": 15,

  // snacks
  crackers: 48,
  biscuits: 42,
  nuts: 95,
  "trail mix": 115,
  chips: 55,
  "piattos": 45,
  popcorn: 42,
  "granola bar": 38,
  "skyflakes": 35,

  // drinks
  water: 20,
  "bottled water": 20,
  juice: 58,
  "orange juice": 65,
  coffee: 185,
  "instant coffee": 125,
  "nescafe": 130,
  tea: 85,
  "green tea": 95,
  "coconut water": 48,
  gatorade: 42,
  coke: 45,
  "soft drink": 45,

  // household
  soap: 48,
  "dish soap": 58,
  shampoo: 125,
  toothpaste: 88,
  "laundry detergent": 98,
  "tide": 110,
  "tissue paper": 58,
  "paper towel": 65,
  "bathroom tissue": 75,
};

/** Staples shown on the market-trend chart (keys in catalog). */
export const PH_TREND_STAPLES = [
  "rice",
  "chicken",
  "eggs",
  "milk",
  "onion",
  "tomato",
] as const;

const CATEGORY_DEFAULTS: Record<string, number> = {
  produce: 60,
  protein: 180,
  dairy: 90,
  grains: 70,
  pantry: 55,
  snacks: 50,
  drinks: 45,
  household: 70,
  other: 50,
};

/** Broad PH seasonal pressure by category (1 = baseline). Index 0 unused; 1–12 = Jan–Dec. */
const CATEGORY_SEASON: Record<string, number[]> = {
  produce: [0, 1.02, 1.0, 0.95, 0.92, 0.94, 1.08, 1.12, 1.1, 1.06, 1.0, 1.08, 1.15],
  protein: [0, 1.04, 1.08, 1.02, 1.0, 1.0, 1.03, 1.04, 1.03, 1.02, 1.05, 1.1, 1.14],
  dairy: [0, 1.02, 1.02, 1.01, 1.0, 1.0, 1.02, 1.03, 1.02, 1.01, 1.02, 1.04, 1.06],
  grains: [0, 1.01, 1.01, 1.0, 1.0, 1.0, 1.02, 1.03, 1.02, 1.01, 1.01, 1.03, 1.05],
  pantry: [0, 1.01, 1.01, 1.0, 1.0, 1.0, 1.01, 1.02, 1.01, 1.01, 1.02, 1.04, 1.06],
  snacks: [0, 1.02, 1.03, 1.01, 1.0, 1.0, 1.01, 1.02, 1.01, 1.02, 1.04, 1.08, 1.12],
  drinks: [0, 1.0, 1.0, 1.02, 1.04, 1.05, 1.03, 1.02, 1.01, 1.0, 1.02, 1.05, 1.08],
  household: [0, 1.01, 1.01, 1.0, 1.0, 1.0, 1.01, 1.01, 1.01, 1.0, 1.02, 1.04, 1.05],
  other: [0, 1.02, 1.02, 1.01, 1.0, 1.0, 1.02, 1.03, 1.02, 1.01, 1.03, 1.06, 1.08],
};

/** Item-level PH seasonality on top of category (peak/off-season). */
const ITEM_SEASON: Record<string, number[]> = {
  mango: [0, 1.25, 1.15, 0.85, 0.75, 0.8, 1.1, 1.2, 1.25, 1.2, 1.15, 1.2, 1.3],
  banana: [0, 1.0, 1.0, 0.98, 0.95, 0.95, 1.05, 1.08, 1.06, 1.02, 1.0, 1.02, 1.05],
  bananas: [0, 1.0, 1.0, 0.98, 0.95, 0.95, 1.05, 1.08, 1.06, 1.02, 1.0, 1.02, 1.05],
  calamansi: [0, 1.05, 1.0, 0.95, 0.9, 0.95, 1.1, 1.15, 1.12, 1.05, 1.0, 1.05, 1.1],
  tomato: [0, 1.05, 1.0, 0.95, 0.9, 0.95, 1.12, 1.18, 1.15, 1.08, 1.0, 1.05, 1.12],
  tomatoes: [0, 1.05, 1.0, 0.95, 0.9, 0.95, 1.12, 1.18, 1.15, 1.08, 1.0, 1.05, 1.12],
  onion: [0, 1.08, 1.05, 1.0, 0.95, 0.95, 1.1, 1.15, 1.12, 1.05, 1.0, 1.08, 1.15],
  onions: [0, 1.08, 1.05, 1.0, 0.95, 0.95, 1.1, 1.15, 1.12, 1.05, 1.0, 1.08, 1.15],
  garlic: [0, 1.1, 1.08, 1.02, 1.0, 1.0, 1.05, 1.08, 1.06, 1.02, 1.05, 1.12, 1.18],
  rice: [0, 1.02, 1.02, 1.0, 0.98, 0.98, 1.02, 1.04, 1.03, 1.0, 1.02, 1.05, 1.08],
  "rice 1kg": [0, 1.02, 1.02, 1.0, 0.98, 0.98, 1.02, 1.04, 1.03, 1.0, 1.02, 1.05, 1.08],
  chicken: [0, 1.03, 1.06, 1.02, 1.0, 1.0, 1.02, 1.03, 1.02, 1.02, 1.05, 1.1, 1.14],
  pork: [0, 1.04, 1.08, 1.02, 1.0, 1.0, 1.02, 1.03, 1.02, 1.02, 1.06, 1.12, 1.16],
  egg: [0, 1.04, 1.06, 1.02, 1.0, 1.0, 1.03, 1.05, 1.04, 1.02, 1.04, 1.08, 1.12],
  eggs: [0, 1.04, 1.06, 1.02, 1.0, 1.0, 1.03, 1.05, 1.04, 1.02, 1.04, 1.08, 1.12],
  "egg tray": [0, 1.04, 1.06, 1.02, 1.0, 1.0, 1.03, 1.05, 1.04, 1.02, 1.04, 1.08, 1.12],
};

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function yearInflationFactor(year: number) {
  const yearsAhead = Math.max(0, year - PRICE_BASE_YEAR);
  return Math.pow(1 + ANNUAL_FOOD_INFLATION, yearsAhead);
}

export function seasonalFactor(
  name: string,
  category: string | null | undefined,
  month: number,
): number {
  const key = normalizeName(name);
  const cat = category ?? "other";
  const catTable = CATEGORY_SEASON[cat] ?? CATEGORY_SEASON.other;
  const categoryFactor = catTable[month] ?? 1;
  const itemTable =
    ITEM_SEASON[key] ??
    Object.entries(ITEM_SEASON).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  const itemFactor = itemTable?.[month] ?? 1;
  return categoryFactor * itemFactor;
}

export function priceMarketContext(now: Date = new Date()) {
  const ph = getPhCalendarDate(now);
  const inflation = yearInflationFactor(ph.year);
  return {
    ...ph,
    timezone: PH_TIMEZONE,
    inflation_factor: Number(inflation.toFixed(4)),
    base_year: PRICE_BASE_YEAR,
    note: `Estimates use ${ph.monthLabel} PH market seasonality + ~${Math.round(ANNUAL_FOOD_INFLATION * 100)}%/yr from ${PRICE_BASE_YEAR}.`,
  };
}

function baseUnitPrice(name: string, category?: string | null) {
  const key = normalizeName(name);
  return (
    PH_GROCERY_PRICE_CATALOG[key] ??
    Object.entries(PH_GROCERY_PRICE_CATALOG).find(([k]) => key.includes(k) || k.includes(key))?.[1] ??
    CATEGORY_DEFAULTS[category ?? "other"] ??
    50
  );
}

function quantityMultiplier(quantity?: string | null) {
  const qtyText = (quantity ?? "1").toLowerCase();
  const numeric = Number.parseFloat(qtyText.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  if (/\bkg\b/.test(qtyText) || /\bkilo/.test(qtyText)) return numeric;
  if (/\bg\b/.test(qtyText) && numeric >= 100) return numeric / 1000;
  if (/dozen/.test(qtyText)) return Math.max(1, numeric) * 12 * 0.08; // ~dozen eggs vs unit egg
  if (/tray/.test(qtyText)) return Math.max(1, numeric) * 2.8;
  if (/packs?|cans?|bottles?|sachets?/.test(qtyText)) {
    return Math.min(12, Math.max(1, numeric));
  }
  if (/pcs?|pieces?|pc\b/.test(qtyText)) {
    // Catalog unit prices are usually "1 pack / typical buy" — scale gently past 1.
    if (numeric <= 1) return 1;
    return Math.min(10, 1 + (numeric - 1) * 0.85);
  }
  if (numeric > 1 && numeric <= 24) return Math.min(10, 1 + (numeric - 1) * 0.75);
  return 1;
}

export type GroceryPriceBreakdown = {
  estimated_price: number;
  unit_price: number;
  low: number;
  high: number;
  category: string;
  market_note: string;
  store_tier: "wet_market" | "supermarket" | "premium";
};

/** Guess category from item name (PH grocery heuristics). */
export function suggestGroceryCategory(name: string): string {
  const key = normalizeName(name);
  if (
    /(hot\s*dog|hotdog|longganisa|tocino|bacon|spam|corned|tender juicy|luncheon|chicken|egg|tuna|bangus|tilapia|galunggong|pork|beef|tofu|tokwa|fish|shrimp|sardine)/.test(
      key,
    )
  ) {
    return "protein";
  }
  if (/(milk|oatside|yogurt|cheese|butter|dairy)/.test(key)) return "dairy";
  if (/(rice|quinoa|oats|bread|pandesal|pasta|noodle|flour|corn flake)/.test(key)) return "grains";
  if (
    /(oil|soy|vinegar|salt|sugar|sauce|coconut|gata|peanut|honey|mayonnaise|ketchup|magic sarap)/.test(
      key,
    )
  ) {
    return "pantry";
  }
  if (/(cracker|biscuit|nut|chip|piattos|popcorn|granola|skyflakes)/.test(key)) return "snacks";
  if (/(water|juice|coffee|tea|gatorade|coke|softdrink|soft drink|nescafe)/.test(key)) {
    return "drinks";
  }
  if (/(soap|shampoo|toothpaste|detergent|tissue|towel|tide)/.test(key)) return "household";
  if (
    /(apple|banana|mango|tomato|onion|garlic|potato|carrot|cabbage|lettuce|cucumber|eggplant|kangkong|pechay|calamansi|lemon|orange|papaya|ginger|spinach|broccoli|avocado|pepper|beans|sayote|ampalaya|sitaw|squash|corn)/.test(
      key,
    )
  ) {
    return "produce";
  }
  return "other";
}

/** Estimate a line price in PHP using today's Asia/Manila year + month. */
export function estimateGroceryPrice(
  name: string,
  quantity?: string | null,
  category?: string | null,
  now: Date = new Date(),
): number {
  return estimateGroceryPriceDetailed(name, quantity, category, now).estimated_price;
}

/** Full breakdown: mid estimate + wet-market→premium band for charts/UI. */
export function estimateGroceryPriceDetailed(
  name: string,
  quantity?: string | null,
  category?: string | null,
  now: Date = new Date(),
): GroceryPriceBreakdown {
  const ph = getPhCalendarDate(now);
  const resolvedCategory = category && category !== "other" ? category : suggestGroceryCategory(name);
  const unit = baseUnitPrice(name, resolvedCategory);
  const market =
    yearInflationFactor(ph.year) *
    seasonalFactor(name, resolvedCategory, ph.month) *
    quantityMultiplier(quantity);
  const mid = Math.max(5, Math.round(unit * market));
  // Wet market ~12% under mid; premium supermarket ~18% over.
  const low = Math.max(5, Math.round(mid * 0.88));
  const high = Math.max(low + 5, Math.round(mid * 1.18));
  return {
    estimated_price: mid,
    unit_price: Math.max(5, Math.round(unit * yearInflationFactor(ph.year))),
    low,
    high,
    category: resolvedCategory,
    market_note: `${ph.monthLabel} PH mid-market (wet→SM/Robinsons band ₱${low}–₱${high})`,
    store_tier: "supermarket",
  };
}

/** Last N months of mid-market unit prices for staple chart. */
export function buildStaplePriceTrends(
  months = 6,
  now: Date = new Date(),
): { label: string; items: { name: string; price: number }[] }[] {
  const ph = getPhCalendarDate(now);
  const series: { label: string; items: { name: string; price: number }[] }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    let month = ph.month - i;
    let year = ph.year;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }
    const label = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      year: "2-digit",
    }).format(new Date(Date.UTC(year, month - 1, 15)));

    const inflation = yearInflationFactor(year);
    const items = PH_TREND_STAPLES.map((name) => {
      const cat = suggestGroceryCategory(name);
      const price = Math.max(
        5,
        Math.round(baseUnitPrice(name, cat) * inflation * seasonalFactor(name, cat, month)),
      );
      return { name, price };
    });
    series.push({ label, items });
  }
  return series;
}

export function formatPhp(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export function catalogHintForPrompt(now: Date = new Date()) {
  const ph = getPhCalendarDate(now);
  const inflation = yearInflationFactor(ph.year);
  const samples = Object.entries(PH_GROCERY_PRICE_CATALOG)
    .slice(0, 55)
    .map(([name, price]) => {
      const live = Math.round(
        price * inflation * seasonalFactor(name, suggestGroceryCategory(name), ph.month),
      );
      return `${name}: ₱${live}`;
    })
    .join(", ");
  return `PH market prices for ${ph.monthLabel} (Asia/Manila). Give mid-supermarket estimates; wet market is ~10–15% lower, premium chains ~15–20% higher. Adjust for quantity (kg, pack, pcs). Prefer correct categories (hotdog/longganisa = protein, not produce). Live samples: ${samples}`;
}
