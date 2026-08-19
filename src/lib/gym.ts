import {
  formatRestDaysLabel,
  formatTrainingDaysLabel,
  GYM_WEEKDAYS,
  isoWeekdayFromDate,
  nextTrainingDayHint,
  parseTrainingDays,
  parseWeekdayIsos,
  reminderDaysFromGymPlan,
  resolveTrainingDays,
  sanitizeTrainingDays,
  SESSION_MINUTE_PRESETS,
  weekdayIsoFromLabel,
} from "@/lib/gym-schedule";

export {
  formatRestDaysLabel,
  formatTrainingDaysLabel,
  GYM_WEEKDAYS,
  isoWeekdayFromDate,
  nextTrainingDayHint,
  parseTrainingDays,
  parseWeekdayIsos,
  reminderDaysFromGymPlan,
  resolveTrainingDays,
  sanitizeTrainingDays,
  SESSION_MINUTE_PRESETS,
  weekdayIsoFromLabel,
};

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

export const GYM_SESSION_FOCUSES = [
  "full_body",
  "strength",
  "fat_loss",
  "mobility",
  "endurance",
  "upper",
  "lower",
  "core",
] as const;

export type GymSessionFocus = (typeof GYM_SESSION_FOCUSES)[number];

export type GymSession = {
  id: number;
  title: string;
  focus: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  exercises: { name?: string; sets?: string; rest?: string; weight?: string; done?: boolean; completed_sets?: number }[] | null;
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
  /** ISO weekdays 1=Mon … 7=Sun the member actually trains. */
  training_days?: number[];
  summary: string | null;
  days: GymPlanDay[];
  recommendations?: string[];
  created_at: string;
};

export function isMachineGear(equipment: string) {
  return equipment === "machine" || equipment === "cable" || equipment === "cardio_machine";
}

/** Photos of the actual equipment — never YouTube thumbs. */
const MACHINE_PHOTOS: Record<string, string> = {
  "chest-press-machine": "/gym/machines/chest-press-machine.png",
  "incline-chest-press-machine": "/gym/machines/chest-press-machine.png",
  "decline-chest-press-machine": "/gym/machines/chest-press-machine.png",
  "iso-lateral-chest-press": "/gym/machines/chest-press-machine.png",
  "shoulder-press-machine": "/gym/machines/shoulder-press-machine.png",
  "preacher-curl-machine": "/gym/machines/preacher-curl-machine.png",
  "bicep-curl-machine": "/gym/machines/preacher-curl-machine.png",
  "lateral-raise-machine": "/gym/machines/lateral-raise-machine.png",
  "rear-delt-fly-machine": "/gym/machines/rear-delt-fly-machine.png",
  "pullover-machine": "/gym/machines/pullover-machine.png",
  "chest-supported-row": "/gym/machines/chest-supported-row.png",
  "iso-lateral-row": "/gym/machines/chest-supported-row.png",
  "high-row-machine": "/gym/machines/chest-supported-row.png",
  "wide-grip-seated-row": "/gym/machines/chest-supported-row.png",
  "t-bar-row-machine": "/gym/machines/chest-supported-row.png",
  "tricep-extension-machine": "/gym/machines/tricep-extension-machine.png",
  "leg-curl-machine": "/gym/machines/lying-leg-curl.png",
  "seated-leg-curl": "/gym/machines/seated-leg-curl.png",
  "standing-leg-curl": "/gym/machines/lying-leg-curl.png",
  "glute-kickback-machine": "/gym/machines/glute-kickback-machine.png",
  "glute-ham-developer": "/gym/machines/glute-ham-developer.png",
  "belt-squat": "/gym/machines/belt-squat.png",
  "pendulum-squat": "/gym/machines/pendulum-squat.png",
  "hip-thrust-machine": "/gym/machines/hip-thrust-machine.png",
  "ab-crunch-machine": "/gym/machines/ab-crunch-machine.png",
  "calf-raise-machine": "/gym/machines/standing-calf-machine.png",
  "donkey-calf-raise": "/gym/machines/standing-calf-machine.png",
  "ski-erg": "/gym/machines/ski-erg.png",
  "assault-bike": "/gym/machines/assault-bike.png",
  "recumbent-bike": "/gym/machines/recumbent-bike.png",
  "stationary-bike": "/gym/machines/recumbent-bike.png",
  "spin-bike": "/gym/machines/spin-bike.png",
  "stair-climber": "/gym/machines/stair-climber.png",
  "jacob-ladder": "/gym/machines/jacob-ladder.png",
  "arm-ergometer": "/gym/machines/arm-ergometer.png",
  "recumbent-stepper": "/gym/machines/recumbent-stepper.png",
};

/** Prefer a photo of the machine itself; fall back to the catalog thumbnail. */
export function gymExerciseCardImage(
  exercise: Pick<GymExercise, "slug" | "demo_thumbnail_url">,
  origin = "",
) {
  const local = MACHINE_PHOTOS[exercise.slug];
  const path = local ?? exercise.demo_thumbnail_url;
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = origin.replace(/\/$/, "");
  return prefix ? `${prefix}${path.startsWith("/") ? path : `/${path}`}` : path;
}

/** Turn slug-style labels (fat_loss) into readable text for UI. */
export function humanizeGymLabel(value: string) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Title-case a typed gym move and strip stray commas / punctuation. */
export function formatGymMoveName(raw: string) {
  const cleaned = String(raw ?? "")
    .replace(/[,;|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^A-Za-z0-9(]+/, "")
    .replace(/[^A-Za-z0-9)]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  if (cleaned.length < 2) return cleaned;
  return cleaned.replace(/[A-Za-z][A-Za-z0-9']*/g, (word) => {
    const lower = word.toLowerCase();
    return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  });
}

export function splitCustomGymMoves(raw: string): string[] {
  return String(raw ?? "")
    .split(",")
    .map((part) => formatGymMoveName(part))
    .filter((name) => name.length >= 2);
}

export type GymMoveDetails = {
  displayName: string;
  muscle_group: string;
  equipment: string;
  cues: string;
};

export function gymMoveDetails(name: string): GymMoveDetails {
  const displayName = formatGymMoveName(name) || "Movement";
  return {
    displayName,
    muscle_group: inferCustomMuscleGroup(displayName),
    equipment: inferCustomEquipment(displayName),
    cues: customGymMoveCue(displayName),
  };
}

/** Map a program day focus (Pull, Legs, HIIT…) onto gym_sessions.focus. */
export function gymSessionFocusFromPlan(focus: string): GymSessionFocus {
  const raw = String(focus ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = raw.replace(/\s+/g, "_");
  if ((GYM_SESSION_FOCUSES as readonly string[]).includes(compact)) {
    return compact as GymSessionFocus;
  }
  if (/\b(upper|push|pull|chest|back|shoulder|arm)\b/.test(raw)) return "upper";
  if (/\b(lower|leg|glute|hamstring|calf|squat)\b/.test(raw)) return "lower";
  if (/\b(core|ab)\b/.test(raw)) return "core";
  if (/\b(cardio|endurance|hiit|run|bike)\b/.test(raw)) return "endurance";
  if (/\b(mobilit|stretch|yoga)\b/.test(raw)) return "mobility";
  if (/\b(fat|cut|loss)\b/.test(raw)) return "fat_loss";
  if (/\b(strength|hypertrophy|power)\b/.test(raw)) return "strength";
  return "full_body";
}

/** Rest strings from programs ("90s", "2 min", "60-90s") → seconds. */
export function parseRestSeconds(rest: string): number {
  const raw = String(rest ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw || raw === "-" || raw === "none" || raw === "no rest") return 0;
  if (/^0+(?:\s*(?:s|sec|secs|seconds|m|min|mins|minutes))?$/.test(raw)) return 0;

  const clamp = (value: number) => Math.max(0, Math.min(600, Math.round(value)));
  const match = raw.match(
    /^(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s*(m|min|mins|minutes|s|sec|secs|seconds)?\b/,
  );
  if (!match) return 60;
  const n = Number(match[1]);
  const unit = match[2] ?? "";
  if (unit.startsWith("m")) return clamp(n * 60);
  return clamp(n);
}

/** "4 x 10-12" / "3 sets" → how many set checkboxes to show. */
export function parseSetCount(sets: string): number {
  const raw = String(sets ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const x = raw.match(/(\d+)\s*[x×]/);
  if (x) return Math.max(1, Math.min(10, Number(x[1])));
  const word = raw.match(/(\d+)\s*sets?\b/);
  if (word) return Math.max(1, Math.min(10, Number(word[1])));
  return 1;
}

export function formatRestClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
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
    insteadOf = formatGymMoveName(insteadOf).slice(0, 80);
    use = formatGymMoveName(use).slice(0, 80);
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
    name = formatGymMoveName(name).slice(0, 80);
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
    name: (formatGymMoveName(String(ex.name ?? "Movement")) || "Movement").slice(0, 80),
    sets: String(ex.sets ?? "3 x 10").slice(0, 40),
    rest: String(ex.rest ?? "60s").slice(0, 20),
    ...(weight ? { weight } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function parseGymPlanDays(raw: unknown): {
  days: GymPlanDay[];
  recommendations: string[];
  training_days: number[];
} {
  const rows = Array.isArray(raw) ? raw : [];
  const recommendations: string[] = [];
  const seen = new Set<string>();
  let packedTraining: unknown;
  const days = rows.map((row, index) => {
    const day = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    if (index === 0) packedTraining = day.training_days;
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
  return {
    days,
    recommendations,
    training_days: resolveTrainingDays({
      training_days: packedTraining,
      days,
      days_per_week: days.length,
    }),
  };
}

/** Persist program-level recs on day 1 so older `days` jsonb stays an array. */
export function serializeGymPlanDays(
  days: GymPlanDay[],
  recommendations: string[],
  trainingDays: number[] = [],
) {
  const recs = clampGymPlanRecommendations(recommendations);
  const schedule = parseTrainingDays(trainingDays);
  return days.map((day, index) => {
    if (index !== 0) return day;
    return {
      ...day,
      ...(recs.length ? { recommendations: recs } : {}),
      ...(schedule.length ? { training_days: schedule } : {}),
    };
  });
}

export function hydrateGymPlan<
  T extends { days?: unknown; recommendations?: unknown; days_per_week?: unknown },
>(row: T): T & { days: GymPlanDay[]; recommendations: string[]; training_days: number[] } {
  const parsed = parseGymPlanDays(row.days);
  const top = clampGymPlanRecommendations(row.recommendations);
  return {
    ...row,
    days: parsed.days,
    recommendations: top.length ? top : parsed.recommendations,
    training_days: resolveTrainingDays({
      training_days: parsed.training_days,
      days: parsed.days,
      days_per_week: Number(row.days_per_week ?? parsed.days.length),
    }),
  };
}

export function formatGymExerciseLine(
  ex: Pick<GymPlanExercise, "name" | "sets" | "rest" | "weight">,
) {
  const parts = [ex.sets];
  if (ex.weight) parts.push(ex.weight);
  parts.push(`rest ${ex.rest}`);
  return `${formatGymMoveName(ex.name) || ex.name} · ${parts.join(" · ")}`;
}

export function labelGymPlanDaysWithWeekdays(days: GymPlanDay[], trainingDays: number[]): GymPlanDay[] {
  const isos = sanitizeTrainingDays(trainingDays, days.length);
  return days.slice(0, isos.length).map((day, index) => {
    const weekday = GYM_WEEKDAYS.find((item) => item.iso === isos[index])?.full ?? `Day ${index + 1}`;
    const focus = humanizeGymLabel(day.focus) || "Training";
    return {
      ...day,
      day: `${weekday} · ${focus}`.slice(0, 40),
    };
  });
}

/** Pick today’s session. Rest days return null so Today does not invent a workout. */
export function pickTodaysPlanDay(
  days: GymPlanDay[],
  date = new Date(),
  trainingDays?: number[],
): GymPlanDay | null {
  if (!days.length) return null;
  const iso = isoWeekdayFromDate(date);
  const named = days.map((day) => weekdayIsoFromLabel(String(day.day ?? "")));
  if (named.some((value) => value != null)) {
    const index = named.findIndex((value) => value === iso);
    return index >= 0 ? (days[index] ?? null) : null;
  }
  const schedule = resolveTrainingDays({
    training_days: trainingDays,
    days,
    days_per_week: days.length,
  });
  const index = schedule.indexOf(iso);
  if (index < 0) return null;
  return days[index] ?? null;
}

/** Find a saved program day by its label or weekday name (Monday, Day 1: Push…). */
export function findPlanDayByLabel(days: GymPlanDay[], label: string | null | undefined): GymPlanDay | null {
  if (!days.length || label == null) return null;
  const needle = String(label).trim().toLowerCase();
  if (!needle) return null;
  const exact = days.find((day) => String(day.day ?? "").trim().toLowerCase() === needle);
  if (exact) return exact;
  const iso = weekdayIsoFromLabel(needle);
  if (iso == null) return null;
  return days.find((day) => weekdayIsoFromLabel(String(day.day ?? "")) === iso) ?? null;
}

/** Today's programmed day, or an explicit saved day when the member picks one. */
export function resolveSessionPlanDay(
  days: GymPlanDay[],
  options?: {
    label?: string | null;
    date?: Date;
    trainingDays?: number[];
    fallbackFirst?: boolean;
  },
): GymPlanDay | null {
  const labeled = findPlanDayByLabel(days, options?.label);
  if (labeled) return labeled;
  const today = pickTodaysPlanDay(days, options?.date, options?.trainingDays);
  if (today) return today;
  if (options?.fallbackFirst && days.length) return days[0] ?? null;
  return null;
}

export type TodaysProgramSummary = {
  title: string;
  focus: string;
  daysPerWeek: number;
  trainingDays: number[];
  planCount: number;
  today: {
    day: string;
    focus: string;
    exercises: { name: string; sets: string }[];
  } | null;
  nextSession: string | null;
};

export function summarizeTodaysProgram(
  plans: Array<Pick<GymPlan, "title" | "focus" | "days_per_week" | "days" | "training_days">>,
  date = new Date(),
): TodaysProgramSummary | null {
  if (!plans.length) return null;
  const plan = plans[0];
  const trainingDays = resolveTrainingDays({
    training_days: plan.training_days,
    days: plan.days ?? [],
    days_per_week: plan.days_per_week,
  });
  const day = pickTodaysPlanDay(plan.days ?? [], date, trainingDays);
  return {
    title: plan.title,
    focus: plan.focus,
    daysPerWeek: trainingDays.length || plan.days_per_week,
    trainingDays,
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
    nextSession: day ? null : nextTrainingDayHint(trainingDays, date),
  };
}

export type GymCatalogItem = Pick<GymExercise, "name" | "muscle_group" | "equipment">;

export type GymPlanCatalogRow = GymCatalogItem & {
  slug?: string;
  difficulty?: string;
};

export const GYM_PLAN_CATALOG_FALLBACK =
  "bodyweight squat, push-up, plank, glute bridge, lat pulldown";

const RELATED_MUSCLES: Record<string, string[]> = {
  legs: ["hamstrings", "glutes", "inner_thighs", "calves"],
  hamstrings: ["legs", "glutes", "inner_thighs"],
  inner_thighs: ["legs", "hamstrings", "glutes"],
  glutes: ["hamstrings", "legs", "inner_thighs"],
  calves: ["legs"],
  chest: ["shoulders", "arms"],
  back: ["shoulders", "arms", "traps"],
  shoulders: ["arms", "chest", "back"],
  arms: ["shoulders", "chest"],
  traps: ["back", "shoulders"],
  core: ["cardio", "mobility"],
  cardio: ["core"],
  lower_back: ["core", "hamstrings"],
  full_body: ["core", "cardio"],
  mobility: ["core"],
};

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

function presentGymPlanDay(day: GymPlanDay, catalog: GymCatalogItem[]): GymPlanDay {
  return {
    ...day,
    exercises: day.exercises.map((ex) => {
      const name = formatGymMoveName(ex.name) || ex.name;
      const match = findExerciseMatch(name, catalog);
      const notes = String(ex.notes ?? "").trim();
      if (notes || match) return { ...ex, name, ...(notes ? { notes } : {}) };
      return { ...ex, name, notes: gymMoveDetails(name).cues };
    }),
    alternatives: day.alternatives?.map((swap) => ({
      instead_of: formatGymMoveName(swap.instead_of) || swap.instead_of,
      use: formatGymMoveName(swap.use) || swap.use,
    })),
    additionals: day.additionals?.map((addon) => ({
      ...addon,
      name: formatGymMoveName(addon.name) || addon.name,
    })),
  };
}

/** Fill missing alternatives / add-ons from the demo catalog so saved Gemini programs still show extras. */
export function enrichGymPlanDays(
  days: GymPlanDay[],
  catalog: GymCatalogItem[],
  avoidTargets: string[] = [],
): GymPlanDay[] {
  if (!days.length) return days;
  const presented = days.map((day) => presentGymPlanDay(day, catalog));
  if (!catalog.length) return presented;
  const avoid = new Set(avoidTargets.map((item) => item.toLowerCase()));
  const usable = catalog.filter((item) => !avoid.has(item.muscle_group.toLowerCase()));

  return presented.map((day) => {
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

function formatGymCatalogLine(row: GymPlanCatalogRow) {
  return `${row.name}${row.slug ? ` [${row.slug}]` : ""} (${row.muscle_group}, ${row.equipment}${
    row.difficulty ? `, ${row.difficulty}` : ""
  })`;
}

/** Prompt catalog: when the user marked known moves, send only that set. */
export function buildGymPlanAvailableExercises(
  rows: GymPlanCatalogRow[],
  prefs: {
    known_machine_slugs: string[];
    known_custom_exercises: string[];
    avoid_targets: string[];
  },
): { catalogText: string; knownRows: GymPlanCatalogRow[]; restrictToKnown: boolean } {
  const knownSet = new Set(prefs.known_machine_slugs.map((slug) => slug.toLowerCase()));
  const knownRows = knownSet.size
    ? rows.filter((row) => knownSet.has(String(row.slug ?? "").toLowerCase()))
    : [];
  const restrictToKnown = knownRows.length > 0 || prefs.known_custom_exercises.length > 0;
  const parts: string[] = [];
  if (prefs.avoid_targets.length) {
    parts.push(`AVOID THESE TARGETS (do not program primary work for): ${prefs.avoid_targets.join(", ")}`);
  }
  if (restrictToKnown) {
    const knownBlock = [
      knownRows.length ? knownRows.map(formatGymCatalogLine).join("\n") : null,
      prefs.known_custom_exercises.length
        ? prefs.known_custom_exercises.map((name) => `${name} (custom, user-typed)`).join("\n")
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    parts.push(
      "ALLOWED EXERCISES ONLY — program exclusively from this list. Do not add any other catalog machine or free-weight move:\n" +
        knownBlock,
    );
  } else {
    parts.push(rows.map(formatGymCatalogLine).join("\n"));
  }
  return {
    catalogText: parts.join("\n\n"),
    knownRows,
    restrictToKnown,
  };
}

/** When known moves are set, only fill swaps/extras from that catalog (empty = skip enrich). */
export function gymPlanEnrichCatalog<T extends { slug?: string }>(
  catalog: T[],
  knownSlugs: string[],
  hasCustomExercises: boolean,
): T[] {
  if (!knownSlugs.length && !hasCustomExercises) return catalog;
  const allowed = new Set(knownSlugs.map((slug) => slug.toLowerCase()));
  return catalog.filter((item) => allowed.has(String(item.slug ?? "").toLowerCase()));
}

function normalizeGymMoveName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(machines?|trainers?|exercises?|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCustomMuscleGroup(name: string) {
  const n = name.toLowerCase();
  if (/\b(sit\s*-?ups?|crunch|plank|ab\b|core|glider)\b/.test(n)) return "core";
  if (/\b(treadmill|bike|cardio|run|jog|elliptical)\b/.test(n)) return "cardio";
  if (/\b(tricep|bicep|arm|pushdown|rope)\b/.test(n) && !/\bleg\b/.test(n)) return "arms";
  if (/\b(shoulder|delt|overhead press)\b/.test(n)) return "shoulders";
  if (/\b(chest|bench|pec|fly)\b/.test(n)) return "chest";
  if (/\bpress\b/.test(n) && !/\b(leg|calf)\b/.test(n)) return "chest";
  if (/\b(lat|pulldown|row)\b/.test(n) || /\bback\b/.test(n)) return "back";
  if (/\b(glute|hip thrust|kickback)\b/.test(n)) return "glutes";
  if (/\b(hamstring|rdl|deadlift|leg curl)\b/.test(n)) return "hamstrings";
  if (/\b(calf)\b/.test(n)) return "calves";
  if (/\b(inner thigh|adductor|abductor)\b/.test(n)) return "inner_thighs";
  if (/\b(leg|squat|lunge|thigh)\b/.test(n)) return "legs";
  return "full_body";
}

function inferCustomEquipment(name: string) {
  const n = name.toLowerCase();
  if (/\b(cable|rope|pushdown|pulldown|face pull)\b/.test(n)) return "cable";
  if (/\b(dumbbell|barbell|kettlebell|landmine)\b/.test(n)) return "free_weight";
  if (/\b(plank|sit\s*-?ups?|crunch|push\s*-?ups?)\b/.test(n)) return "bodyweight";
  if (/\b(machine|press|curl|extension|pec|deck|fly)\b/.test(n)) return "machine";
  return "free_weight";
}

function customGymMoveCue(name: string) {
  const n = name.toLowerCase();
  if (/\bpress\b/.test(n)) return "Brace your core, keep a controlled path, and stop just short of lockout.";
  if (/\b(tricep|pushdown|rope|extension)\b/.test(n) && !/\bleg\b/.test(n)) {
    return "Keep elbows pinned and finish with a full squeeze.";
  }
  if (/\bcurl\b/.test(n)) return "Move through a full range and squeeze at the top without swinging.";
  if (/\b(row|pulldown)\b/.test(n)) return "Pull with your back, keep the chest open, and control the return.";
  if (/\b(hip thrust|glute)\b/.test(n)) return "Tuck the chin, drive through the heels, and squeeze at the top.";
  if (/\b(squat|lunge|leg)\b/.test(n)) return "Brace your core, track knees over toes, and push through a full range.";
  switch (inferCustomMuscleGroup(name)) {
    case "chest":
      return "Keep your chest high and control both the press and the return.";
    case "back":
      return "Lead with the elbows and keep the shoulders packed.";
    case "arms":
      return "Lock the upper arms in place and squeeze at the end of the rep.";
    case "shoulders":
      return "Brace your core and lift without shrugging.";
    case "core":
      return "Keep the ribs down and breathe through a tight midline.";
    case "cardio":
      return "Stay smooth and keep an easy, repeatable pace.";
    default:
      return "Use a full range of motion and keep the weight under control.";
  }
}

const SKIP_MOVE_TOKENS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "with",
  "machine",
  "trainer",
  "exercise",
  "exercises",
]);

function significantMoveTokens(name: string) {
  return normalizeGymMoveName(name)
    .split(" ")
    .filter((token) => token.length >= 4 && !SKIP_MOVE_TOKENS.has(token));
}

/** Closest catalog demo for a typed custom move (same muscle + shared token). */
export function findRelatedExerciseMatch<T extends { name: string; muscle_group?: string }>(
  name: string,
  exercises: T[],
) {
  const exact = findExerciseMatch(name, exercises);
  if (exact) return exact;
  const tokens = significantMoveTokens(name);
  if (!tokens.length) return undefined;
  const muscle = inferCustomMuscleGroup(name);
  let best: T | undefined;
  let bestScore = 0;
  for (const item of exercises) {
    const overlap = significantMoveTokens(item.name).filter((token) => tokens.includes(token)).length;
    if (!overlap) continue;
    const itemMuscle = String(item.muscle_group ?? "");
    if (itemMuscle && itemMuscle !== muscle) continue;
    const score = overlap + (itemMuscle === muscle ? 2 : 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

type KnownMovePoolItem = {
  name: string;
  muscle_group: string;
  slug?: string;
};

export function isAllowedGymPlanMove(name: string, allowed: Array<{ name: string; slug?: string }>) {
  const needle = name.toLowerCase().trim();
  if (!needle || !allowed.length) return false;
  if (allowed.some((item) => item.slug && item.slug.toLowerCase() === needle)) return true;
  if (allowed.some((item) => item.name.toLowerCase() === needle)) return true;
  const normalizedNeedle = normalizeGymMoveName(name);
  if (!normalizedNeedle) return false;
  return allowed.some((item) => {
    const known = normalizeGymMoveName(item.name);
    if (!known) return false;
    if (normalizedNeedle === known) return true;
    const [short, long] =
      normalizedNeedle.length <= known.length
        ? [normalizedNeedle, known]
        : [known, normalizedNeedle];
    // Short tokens like "press" must not match every press machine.
    return short.length >= 10 && long.includes(short);
  });
}

function muscleForMoveName(name: string, catalog: Array<{ name: string; muscle_group: string }>) {
  return findExerciseMatch(name, catalog)?.muscle_group ?? inferCustomMuscleGroup(name);
}

function pickKnownReplacement(
  wantedName: string,
  used: Set<string>,
  pool: KnownMovePoolItem[],
  catalog: Array<{ name: string; muscle_group: string }>,
): KnownMovePoolItem | null {
  const unused = pool.filter((item) => !used.has(item.name.toLowerCase()));
  if (!unused.length) return null;
  const wantedMuscle = muscleForMoveName(wantedName, catalog);
  const same = unused.find((item) => item.muscle_group === wantedMuscle);
  if (same) return same;
  for (const group of RELATED_MUSCLES[wantedMuscle] ?? []) {
    const related = unused.find((item) => item.muscle_group === group);
    if (related) return related;
  }
  return unused[0] ?? null;
}

function canonicalKnownName(name: string, pool: KnownMovePoolItem[]) {
  const exact = pool.find((item) => item.name.toLowerCase() === name.toLowerCase().trim());
  if (exact) return exact.name;
  const slug = pool.find((item) => item.slug && item.slug.toLowerCase() === name.toLowerCase().trim());
  if (slug) return slug.name;
  const normalizedNeedle = normalizeGymMoveName(name);
  const close = pool.find((item) => normalizeGymMoveName(item.name) === normalizedNeedle);
  return close?.name ?? name;
}

/**
 * When the user marked known moves, drop/replace anything Gemini added from the rest of the catalog
 * (classic leak: unmarked "Horizontal leg press" on a hamstring day).
 */
export function constrainGymPlanToKnownMoves(
  days: GymPlanDay[],
  knownMoves: KnownMovePoolItem[],
  customExercises: string[] = [],
  fullCatalog: Array<{ name: string; muscle_group: string; equipment?: string }> = [],
): GymPlanDay[] {
  if (!knownMoves.length && !customExercises.length) return days;
  const pool: KnownMovePoolItem[] = [
    ...knownMoves,
    ...customExercises.map((name) => {
      const formatted = formatGymMoveName(name) || name;
      return {
        name: formatted,
        muscle_group: muscleForMoveName(formatted, fullCatalog.length ? fullCatalog : knownMoves),
      };
    }),
  ];
  const catalog = fullCatalog.length ? fullCatalog : knownMoves;

  return days.map((day) => {
    const used = new Set<string>();
    const remaps = new Map<string, string>();

    const mapToAllowed = (rawName: string): string | null => {
      if (isAllowedGymPlanMove(rawName, pool)) {
        const canonical = canonicalKnownName(rawName, pool);
        used.add(canonical.toLowerCase());
        if (canonical.toLowerCase() !== rawName.toLowerCase()) {
          remaps.set(rawName.toLowerCase(), canonical);
        }
        return canonical;
      }
      const replacement = pickKnownReplacement(rawName, used, pool, catalog);
      if (!replacement) return null;
      used.add(replacement.name.toLowerCase());
      remaps.set(rawName.toLowerCase(), replacement.name);
      return replacement.name;
    };

    let exercises = day.exercises.flatMap((ex) => {
      const name = mapToAllowed(ex.name);
      if (!name) return [];
      if (name.toLowerCase() === ex.name.toLowerCase()) return [{ ...ex, name }];
      const { notes: _notes, ...rest } = ex;
      return [{ ...rest, name }];
    });

    if (!exercises.length) {
      for (const item of pool) {
        if (exercises.length >= 3) break;
        if (used.has(item.name.toLowerCase())) continue;
        used.add(item.name.toLowerCase());
        exercises.push({ name: item.name, sets: "3 x 10", rest: "60s" });
      }
    }

    const seenExercise = new Set<string>();
    exercises = exercises.filter((ex) => {
      const key = ex.name.toLowerCase();
      if (seenExercise.has(key)) return false;
      seenExercise.add(key);
      return true;
    });

    const alternatives = (day.alternatives ?? []).flatMap((swap) => {
      const insteadOf = remaps.get(swap.instead_of.toLowerCase()) ?? swap.instead_of;
      if (!isAllowedGymPlanMove(swap.use, pool)) return [];
      const use = canonicalKnownName(swap.use, pool);
      if (use.toLowerCase() === insteadOf.toLowerCase()) return [];
      if (!exercises.some((ex) => ex.name.toLowerCase() === insteadOf.toLowerCase())) return [];
      return [{ instead_of: insteadOf, use }];
    });

    const additionals = (day.additionals ?? []).flatMap((addon) => {
      if (!isAllowedGymPlanMove(addon.name, pool)) return [];
      const name = canonicalKnownName(addon.name, pool);
      if (exercises.some((ex) => ex.name.toLowerCase() === name.toLowerCase())) return [];
      return [{ ...addon, name }];
    });

    const { alternatives: _oldAlts, additionals: _oldAdds, ...rest } = day;
    return {
      ...rest,
      exercises,
      ...(alternatives.length ? { alternatives } : {}),
      ...(additionals.length ? { additionals } : {}),
    };
  });
}
