export type GymExercise = {
  id: number;
  slug: string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  duration_seconds: number;
  demo_video_url: string;
  demo_thumbnail_url: string | null;
  cues: string | null;
};

export type GymSession = {
  id: number;
  title: string;
  focus: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  exercises: { name?: string; sets?: string }[] | null;
  notes: string | null;
  logged_at: string;
};

export type GymPlanExercise = {
  name: string;
  sets: string;
  rest: string;
  weight?: string;
  notes?: string;
};

/** Swap a programmed move for a same-pattern substitute. */
export type GymPlanSwap = {
  instead_of: string;
  use: string;
};

/** Optional extra move if the session still has time. */
export type GymPlanAddon = {
  name: string;
  sets?: string;
};

export type GymPlanDay = {
  day: string;
  focus: string;
  exercises: GymPlanExercise[];
  alternatives?: GymPlanSwap[];
  additionals?: GymPlanAddon[];
};

export type GymPlan = {
  id: number;
  title: string;
  focus: string;
  level: string;
  days_per_week: number;
  summary: string | null;
  days: GymPlanDay[];
  recommendations?: string[];
  created_at: string;
};

export function isMachineGear(equipment: string) {
  return equipment === "machine" || equipment === "cable" || equipment === "cardio_machine";
}

/** Turn slug-style labels (fat_loss) into readable text for UI. */
export function humanizeGymLabel(value: string) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clampGymPlanRecommendations(value: unknown, max = 8) {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = String(item ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    if (text.length < 2) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

export function parseGymPlanSwaps(raw: unknown): GymPlanSwap[] {
  if (!Array.isArray(raw)) return [];
  const out: GymPlanSwap[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let insteadOf = "";
    let use = "";
    if (typeof item === "string") {
      const text = item.replace(/\s+/g, " ").trim();
      const instead = text.match(/^(.+?)\s+instead of\s+(.+)$/i);
      const arrow = text.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
      if (instead) {
        use = instead[1].trim();
        insteadOf = instead[2].trim();
      } else if (arrow) {
        insteadOf = arrow[1].trim();
        use = arrow[2].trim();
      }
    } else if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      insteadOf = String(row.instead_of ?? row.from ?? "").replace(/\s+/g, " ").trim();
      use = String(row.use ?? row.to ?? row.name ?? "").replace(/\s+/g, " ").trim();
    }
    insteadOf = insteadOf.slice(0, 80);
    use = use.slice(0, 80);
    if (insteadOf.length < 2 || use.length < 2) continue;
    const key = `${insteadOf.toLowerCase()}=>${use.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ instead_of: insteadOf, use });
    if (out.length >= 4) break;
  }
  return out;
}

export function parseGymPlanAddons(raw: unknown): GymPlanAddon[] {
  if (!Array.isArray(raw)) return [];
  const out: GymPlanAddon[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let name = "";
    let sets = "";
    if (typeof item === "string") {
      name = item.replace(/\s+/g, " ").trim();
    } else if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      name = String(row.name ?? row.use ?? "").replace(/\s+/g, " ").trim();
      sets = String(row.sets ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    }
    name = name.slice(0, 80);
    if (name.length < 2) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, ...(sets ? { sets } : {}) });
    if (out.length >= 4) break;
  }
  return out;
}

export function parseGymPlanExercise(raw: unknown): GymPlanExercise {
  const ex = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const weight = String(ex.weight ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  const notes = String(ex.notes ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return {
    name: String(ex.name ?? "Movement").slice(0, 80),
    sets: String(ex.sets ?? "3 x 10").slice(0, 40),
    rest: String(ex.rest ?? "60s").slice(0, 20),
    ...(weight ? { weight } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function parseGymPlanDays(raw: unknown): { days: GymPlanDay[]; recommendations: string[] } {
  const rows = Array.isArray(raw) ? raw : [];
  const recommendations: string[] = [];
  const seen = new Set<string>();
  const days = rows.map((row) => {
    const day = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    for (const rec of clampGymPlanRecommendations(day.recommendations)) {
      const key = rec.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recommendations.push(rec);
    }
    const alternatives = parseGymPlanSwaps(day.alternatives);
    const additionals = parseGymPlanAddons(day.additionals);
    return {
      day: String(day.day ?? "Day").slice(0, 40),
      focus: String(day.focus ?? "Training").slice(0, 60),
      exercises: (Array.isArray(day.exercises) ? day.exercises : []).slice(0, 6).map(parseGymPlanExercise),
      ...(alternatives.length ? { alternatives } : {}),
      ...(additionals.length ? { additionals } : {}),
    };
  });
  return { days, recommendations };
}

/** Persist program-level recs on day 1 so older `days` jsonb stays an array. */
export function serializeGymPlanDays(days: GymPlanDay[], recommendations: string[]) {
  const recs = clampGymPlanRecommendations(recommendations);
  return days.map((day, index) => (index === 0 && recs.length ? { ...day, recommendations: recs } : day));
}

export function hydrateGymPlan<T extends { days?: unknown; recommendations?: unknown }>(
  row: T,
): T & { days: GymPlanDay[]; recommendations: string[] } {
  const parsed = parseGymPlanDays(row.days);
  const top = clampGymPlanRecommendations(row.recommendations);
  return {
    ...row,
    days: parsed.days,
    recommendations: top.length ? top : parsed.recommendations,
  };
}

export function formatGymExerciseLine(
  ex: Pick<GymPlanExercise, "name" | "sets" | "rest" | "weight">,
) {
  const parts = [ex.sets];
  if (ex.weight) parts.push(ex.weight);
  parts.push(`rest ${ex.rest}`);
  return `${ex.name} · ${parts.join(" · ")}`;
}

const WEEKDAY_FULL = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const WEEKDAY_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Pick the session that should show on Today — weekday name first, else Mon-based rotation. */
export function pickTodaysPlanDay(days: GymPlanDay[], date = new Date()): GymPlanDay | null {
  if (!days.length) return null;
  const dow = date.getDay();
  const full = WEEKDAY_FULL[dow];
  const short = WEEKDAY_SHORT[dow];
  const named = days.find((day) => {
    const label = String(day.day ?? "").toLowerCase();
    const tokens = label.split(/[\s,/:.-]+/).filter(Boolean);
    return label.includes(full) || tokens.includes(short);
  });
  if (named) return named;
  const mondayIndex = dow === 0 ? 6 : dow - 1;
  return days[mondayIndex % days.length] ?? days[0];
}

export type TodaysProgramSummary = {
  title: string;
  focus: string;
  daysPerWeek: number;
  planCount: number;
  today: {
    day: string;
    focus: string;
    exercises: { name: string; sets: string }[];
  } | null;
};

export function summarizeTodaysProgram(
  plans: Array<Pick<GymPlan, "title" | "focus" | "days_per_week" | "days">>,
  date = new Date(),
): TodaysProgramSummary | null {
  if (!plans.length) return null;
  const plan = plans[0];
  const day = pickTodaysPlanDay(plan.days ?? [], date);
  return {
    title: plan.title,
    focus: plan.focus,
    daysPerWeek: plan.days_per_week,
    planCount: plans.length,
    today: day
      ? {
          day: day.day,
          focus: day.focus,
          exercises: (day.exercises ?? []).slice(0, 4).map((ex) => ({
            name: ex.name,
            sets: ex.sets,
          })),
        }
      : null,
  };
}

type GymCatalogItem = Pick<GymExercise, "name" | "muscle_group" | "equipment">;

const ADDON_COMPLEMENT: Record<string, string[]> = {
  back: ["shoulders", "arms", "core"],
  chest: ["arms", "shoulders", "core"],
  shoulders: ["arms", "core"],
  traps: ["back", "shoulders"],
  arms: ["shoulders", "core"],
  forearms: ["arms"],
  legs: ["calves", "hamstrings", "core", "inner_thighs"],
  hamstrings: ["calves", "core", "legs"],
  inner_thighs: ["calves", "core", "legs"],
  glutes: ["hamstrings", "core"],
  calves: ["core", "legs"],
  core: ["cardio"],
  cardio: ["core", "mobility"],
  lower_back: ["core", "hamstrings"],
  full_body: ["core", "cardio"],
  mobility: ["core"],
};

function addonSetsFor(item: GymCatalogItem) {
  if (item.equipment === "cardio_machine" || item.muscle_group === "cardio") return "8–12 mins easy";
  if (item.muscle_group === "core" || item.muscle_group === "mobility") return "2 x 12-15";
  return "2–3 x 12-15";
}

/** Fill missing alternatives / add-ons from the demo catalog so saved Gemini programs still show extras. */
export function enrichGymPlanDays(
  days: GymPlanDay[],
  catalog: GymCatalogItem[],
  avoidTargets: string[] = [],
): GymPlanDay[] {
  if (!days.length || !catalog.length) return days;
  const avoid = new Set(avoidTargets.map((item) => item.toLowerCase()));
  const usable = catalog.filter((item) => !avoid.has(item.muscle_group.toLowerCase()));

  return days.map((day) => {
    const used = new Set(
      [
        ...day.exercises.map((ex) => ex.name),
        ...(day.alternatives ?? []).map((swap) => swap.use),
        ...(day.additionals ?? []).map((addon) => addon.name),
      ].map((name) => name.toLowerCase()),
    );
    const alternatives = [...(day.alternatives ?? [])];
    for (const ex of day.exercises) {
      if (alternatives.length >= 3) break;
      const match = findExerciseMatch(ex.name, usable);
      if (!match) continue;
      const pool = usable.filter((item) => {
        const key = item.name.toLowerCase();
        return (
          item.muscle_group === match.muscle_group &&
          key !== match.name.toLowerCase() &&
          !used.has(key)
        );
      });
      const swappedGear = pool.filter((item) => item.equipment !== match.equipment);
      const pick = swappedGear[0] ?? pool[0];
      if (!pick) continue;
      used.add(pick.name.toLowerCase());
      alternatives.push({ instead_of: ex.name, use: pick.name });
    }

    const additionals = [...(day.additionals ?? [])];
    const dayMuscles = day.exercises
      .map((ex) => findExerciseMatch(ex.name, usable)?.muscle_group)
      .filter((group): group is string => Boolean(group));
    const targets: string[] = [];
    for (const muscle of dayMuscles) {
      for (const next of ADDON_COMPLEMENT[muscle] ?? []) {
        if (!avoid.has(next) && !targets.includes(next)) targets.push(next);
      }
    }
    for (const muscle of targets) {
      if (additionals.length >= 2) break;
      const pick = usable.find((item) => item.muscle_group === muscle && !used.has(item.name.toLowerCase()));
      if (!pick) continue;
      used.add(pick.name.toLowerCase());
      additionals.push({ name: pick.name, sets: addonSetsFor(pick) });
    }

    return {
      ...day,
      ...(alternatives.length ? { alternatives } : {}),
      ...(additionals.length ? { additionals } : {}),
    };
  });
}

/** Match an AI/program exercise name to a catalog demo (exact, then loose contains). */
export function findExerciseMatch<T extends { name: string }>(name: string, exercises: T[]) {
  const needle = name.toLowerCase().trim();
  if (!needle) return undefined;
  const exact = exercises.find((item) => item.name.toLowerCase() === needle);
  if (exact) return exact;
  const contained = exercises.find((item) => {
    const catalog = item.name.toLowerCase();
    return needle.includes(catalog) || catalog.includes(needle);
  });
  if (contained) return contained;
  // Strip common suffixes the model adds (" machine", " trainer") and retry.
  const stripped = needle
    .replace(/\b(machine|trainer|bike|climber)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped || stripped === needle) return undefined;
  return exercises.find((item) => {
    const catalog = item.name.toLowerCase();
    return catalog.includes(stripped) || stripped.includes(catalog.replace(/\b(machine|trainer)\b/g, "").trim());
  });
}
