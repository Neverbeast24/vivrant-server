import { sanitizeTrainingDays } from "@/lib/gym-schedule";
import { formatGymMoveName, splitCustomGymMoves } from "@/lib/gym";

export type BmiBand = "underweight" | "normal" | "overweight" | "obese";

export type RoutineScaling = {
  bmi: number | null;
  band: BmiBand | null;
  band_label: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  kg_to_goal: number | null;
  target_date: string | null;
  weeks_remaining: number | null;
  suggested_kg_per_week: number | null;
  pace_note: string | null;
  focus: string;
  days_per_week: string;
  session_minutes: string;
  intensity: string;
  tips: string[];
  summary: string;
};

export const GYM_PLAN_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type GymPlanLevel = (typeof GYM_PLAN_LEVELS)[number];

/** Editable program prefs used by Training program + AI generation. */
export type GymPlanPrefs = {
  days_per_week: number;
  /** ISO weekdays 1=Mon … 7=Sun. Length matches days_per_week. */
  training_days: number[];
  session_minutes: number;
  /** Self-reported experience — drives AI working loads, not BMI band. */
  level: GymPlanLevel;
  /** Catalog slugs for machines / free-weight moves the user already knows. */
  known_machine_slugs: string[];
  /** Free-text moves the user typed that are not in the catalog checklist. */
  known_custom_exercises: string[];
  /** Muscle / focus areas the user does not want emphasized (e.g. core). */
  avoid_targets: string[];
};

/** Areas a member can opt out of when generating an AI gym program. */
export const GYM_AVOID_TARGETS = [
  "core",
  "arms",
  "forearms",
  "shoulders",
  "chest",
  "back",
  "traps",
  "legs",
  "glutes",
  "hamstrings",
  "calves",
  "inner_thighs",
  "lower_back",
  "cardio",
  "mobility",
] as const;

export type GymAvoidTarget = (typeof GYM_AVOID_TARGETS)[number];

const AVOID_TARGET_SET = new Set<string>(GYM_AVOID_TARGETS);

function midpointFromRange(raw: string, fallback: number) {
  const nums = String(raw)
    .match(/\d+/g)
    ?.map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  if (!nums?.length) return fallback;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

/** Max catalog slugs a member can mark as known (covers a full gym-floor checklist). */
export const MAX_KNOWN_MACHINE_SLUGS = 250;

function sanitizeKnownMachineSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const raw of input) {
    const slug = String(raw ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 80);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    if (seen.size >= MAX_KNOWN_MACHINE_SLUGS) break;
  }
  return [...seen];
}

function sanitizeCustomExercises(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const parts = String(raw ?? "").includes(",")
      ? splitCustomGymMoves(String(raw ?? ""))
      : [formatGymMoveName(String(raw ?? ""))];
    for (const name of parts) {
      if (name.length < 2) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
      if (out.length >= 20) return out;
    }
  }
  return out;
}

function sanitizeAvoidTargets(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const raw of input) {
    const target = String(raw ?? "")
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .slice(0, 40);
    if (!AVOID_TARGET_SET.has(target) || seen.has(target)) continue;
    seen.add(target);
  }
  return [...seen];
}

export function clampGymPlanLevel(input: unknown): GymPlanLevel {
  const value = String(input ?? "")
    .trim()
    .toLowerCase();
  return value === "intermediate" || value === "advanced" ? value : "beginner";
}

/** Turn BMI-suggested range strings into editable number defaults. */
export function parseRoutineDefaults(scaling: Pick<RoutineScaling, "days_per_week" | "session_minutes"> | null | undefined): GymPlanPrefs {
  const daysPerWeek = Math.max(2, Math.min(6, midpointFromRange(scaling?.days_per_week ?? "3", 3)));
  const trainingDays = sanitizeTrainingDays(undefined, daysPerWeek);
  return {
    days_per_week: trainingDays.length,
    training_days: trainingDays,
    session_minutes: Math.max(15, Math.min(120, midpointFromRange(scaling?.session_minutes ?? "45", 45))),
    level: "beginner",
    known_machine_slugs: [],
    known_custom_exercises: [],
    avoid_targets: [],
  };
}

/** JSON / form payloads — every field is sanitized, including unknown `level` strings. */
export type GymPlanPrefsInput = {
  days_per_week?: unknown;
  training_days?: unknown;
  session_minutes?: unknown;
  level?: unknown;
  known_machine_slugs?: unknown;
  known_custom_exercises?: unknown;
  avoid_targets?: unknown;
};

export function clampGymPlanPrefs(input: GymPlanPrefsInput | Partial<GymPlanPrefs> | null | undefined): GymPlanPrefs {
  const days = Number(input?.days_per_week);
  const session = Number(input?.session_minutes);
  const fallbackCount = Math.max(2, Math.min(6, Number.isFinite(days) ? Math.round(days) : 3));
  const trainingDays = sanitizeTrainingDays(input?.training_days, fallbackCount);
  return {
    days_per_week: trainingDays.length,
    training_days: trainingDays,
    session_minutes: Math.max(15, Math.min(120, Number.isFinite(session) ? Math.round(session) : 45)),
    level: clampGymPlanLevel(input?.level),
    known_machine_slugs: sanitizeKnownMachineSlugs(input?.known_machine_slugs),
    known_custom_exercises: sanitizeCustomExercises(input?.known_custom_exercises),
    avoid_targets: sanitizeAvoidTargets(input?.avoid_targets),
  };
}

/** Overlay user-chosen days/session onto routine_scaling for AI prompts. */
export function applyRoutineOverrides(
  scaling: RoutineScaling,
  prefs: GymPlanPrefs,
): RoutineScaling {
  const clamped = clampGymPlanPrefs(prefs);
  return {
    ...scaling,
    days_per_week: String(clamped.days_per_week),
    session_minutes: String(clamped.session_minutes),
  };
}

export const BMI_BAND_LABELS: Record<BmiBand, string> = {
  underweight: "Underweight",
  normal: "Normal",
  overweight: "Overweight",
  obese: "Obese",
};

const BAND_LABELS = BMI_BAND_LABELS;

export function computeBmi(heightCm: number, weightKg: number) {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  return weightKg / (heightCm / 100) ** 2;
}

export function bmiBand(bmi: number): BmiBand {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export type BmiSummary = {
  bmi: number;
  band: BmiBand;
  band_label: string;
  height_cm: number;
  weight_kg: number;
};

/** Dashboard-ready BMI from profile height/weight. Null when either value is missing. */
export function summarizeBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined,
): BmiSummary | null {
  if (heightCm == null || weightKg == null) return null;
  const bmi = computeBmi(Number(heightCm), Number(weightKg));
  if (bmi == null) return null;
  const band = bmiBand(bmi);
  return {
    bmi: Number(bmi.toFixed(1)),
    band,
    band_label: BMI_BAND_LABELS[band],
    height_cm: Number(heightCm),
    weight_kg: Number(weightKg),
  };
}

export function weightForBmi(heightCm: number, targetBmi: number) {
  return targetBmi * (heightCm / 100) ** 2;
}

function weeksUntil(targetDate: string, today = new Date()) {
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const ms = target.getTime() - start.getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

function resolveGoalWeight(
  heightCm: number | null,
  weightKg: number | null,
  goalWeightKg: number | null,
  band: BmiBand | null,
) {
  if (goalWeightKg != null && goalWeightKg > 0) return goalWeightKg;
  if (heightCm == null || weightKg == null || band == null || band === "normal") return null;
  if (band === "underweight") return weightForBmi(heightCm, 18.5);
  return weightForBmi(heightCm, 24.9);
}

function bandRoutine(band: BmiBand | null, paceKgPerWeek: number | null) {
  const aggressive = paceKgPerWeek != null && Math.abs(paceKgPerWeek) > 0.75;

  switch (band) {
    case "underweight":
      return {
        focus: "strength + muscle gain",
        days_per_week: "3–4",
        session_minutes: "35–50",
        intensity: "moderate progressive overload",
        tips: [
          "Prioritize compound strength over long cardio.",
          "Use machines for safe load progression, then free weights.",
          "Pair training with a calorie surplus and protein-forward meals.",
        ],
      };
    case "overweight":
      return {
        focus: aggressive ? "fat loss with joint-friendly strength" : "fat loss + strength retention",
        days_per_week: aggressive ? "4–5" : "3–4",
        session_minutes: aggressive ? "30–45" : "35–55",
        intensity: "moderate; keep form strict",
        tips: [
          "Blend strength machines with steady cardio (walk, bike, elliptical).",
          "Keep weekly weight change near 0.25–0.75 kg for sustainability.",
          "Log gym sessions so AI plans can tighten volume over time.",
        ],
      };
    case "obese":
      return {
        focus: "low-impact consistency + strength foundation",
        days_per_week: "3–5 short sessions",
        session_minutes: "20–40",
        intensity: "easy-to-moderate; protect joints",
        tips: [
          "Prefer machines, cables, and seated work before free weights.",
          "Add daily walks in Movement; keep gym days short but frequent.",
          "If the target date forces >0.75 kg/week, extend the date rather than intensity.",
        ],
      };
    case "normal":
    default:
      return {
        focus: "balanced strength + conditioning",
        days_per_week: "3–4",
        session_minutes: "35–55",
        intensity: "moderate",
        tips: [
          "Maintain BMI with mixed strength and light cardio.",
          "Use Gym AI plans for structured weeks; Movement for daily steps.",
          "If chasing a goal weight, keep pace under ~0.5 kg/week.",
        ],
      };
  }
}

export function pickGoalTargetDate(
  goals: { category?: string | null; unit?: string | null; target_date?: string | null }[] | null,
) {
  const dated = (goals ?? []).filter((goal) => goal.target_date);
  if (!dated.length) return null;
  const weightLike = dated.filter((goal) => {
    const unit = (goal.unit ?? "").toLowerCase();
    const category = (goal.category ?? "").toLowerCase();
    return unit.includes("kg") || category === "movement" || category === "nutrition";
  });
  const pool = weightLike.length ? weightLike : dated;
  return [...pool].sort((a, b) => String(a.target_date).localeCompare(String(b.target_date)))[0]
    ?.target_date ?? null;
}

export function buildRoutineScaling(input: {
  height_cm?: number | null;
  weight_kg?: number | null;
  goal_weight_kg?: number | null;
  target_date?: string | null;
  today?: Date;
}): RoutineScaling {
  const height = input.height_cm ?? null;
  const weight = input.weight_kg ?? null;
  const bmi =
    height != null && weight != null ? computeBmi(height, weight) : null;
  const band = bmi != null ? bmiBand(bmi) : null;
  const goalWeight = resolveGoalWeight(height, weight, input.goal_weight_kg ?? null, band);
  const kgToGoal =
    goalWeight != null && weight != null ? Number((goalWeight - weight).toFixed(1)) : null;
  const targetDate = input.target_date ?? null;
  const weeks =
    targetDate != null ? weeksUntil(targetDate, input.today ?? new Date()) : null;
  const suggestedKgPerWeek =
    kgToGoal != null && weeks != null && weeks > 0
      ? Number((kgToGoal / weeks).toFixed(2))
      : null;

  const routine = bandRoutine(band, suggestedKgPerWeek);

  let paceNote: string | null = null;
  if (suggestedKgPerWeek != null && kgToGoal != null && weeks != null) {
    const abs = Math.abs(suggestedKgPerWeek);
    const direction = kgToGoal > 0 ? "gain" : "lose";
    if (weeks === 0) {
      paceNote = "Target date is today or past — set a new date for a realistic forecast.";
    } else if (abs > 1) {
      paceNote = `Forecast asks ~${abs.toFixed(2)} kg/${direction === "gain" ? "gain" : "loss"} per week — too aggressive. Prefer extending the target date.`;
    } else if (abs > 0.75) {
      paceNote = `Ambitious pace: ~${abs.toFixed(2)} kg/${direction} per week over ${weeks} week(s). Keep sessions sustainable.`;
    } else {
      paceNote = `On track for ~${abs.toFixed(2)} kg/${direction} per week over ${weeks} week(s).`;
    }
  } else if (kgToGoal != null) {
    paceNote =
      kgToGoal === 0
        ? "At goal weight — focus on maintenance routines."
        : `About ${Math.abs(kgToGoal).toFixed(1)} kg to ${kgToGoal > 0 ? "gain" : "lose"}. Add a target date on Goals for a weekly pace forecast.`;
  } else if (band) {
    paceNote = "Add height, weight, goal weight, and a target date to unlock pace-based plans.";
  }

  const summaryParts = [
    band ? `BMI ${bmi!.toFixed(1)} (${BAND_LABELS[band]})` : "BMI not set",
    routine.focus,
    targetDate ? `target ${targetDate}` : null,
  ].filter(Boolean);

  return {
    bmi: bmi != null ? Number(bmi.toFixed(1)) : null,
    band,
    band_label: band ? BAND_LABELS[band] : null,
    height_cm: height,
    weight_kg: weight,
    goal_weight_kg: goalWeight,
    kg_to_goal: kgToGoal,
    target_date: targetDate,
    weeks_remaining: weeks,
    suggested_kg_per_week: suggestedKgPerWeek,
    pace_note: paceNote,
    focus: routine.focus,
    days_per_week: routine.days_per_week,
    session_minutes: routine.session_minutes,
    intensity: routine.intensity,
    tips: routine.tips,
    summary: summaryParts.join(" · "),
  };
}
