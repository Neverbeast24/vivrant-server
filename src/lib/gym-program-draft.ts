import {
  clampGymPlanRecommendations,
  hydrateGymPlan,
  humanizeGymLabel,
  parseGymPlanDays,
  weekdayIsoFromLabel,
  type GymPlanDay,
} from "@/lib/gym";
import { GYM_WEEKDAYS, parseWeekdayIsos, sanitizeTrainingDays } from "@/lib/gym-schedule";
import type { GymPlanPrefs } from "@/lib/health/body-metrics";

export const GYM_PROGRAM_DRAFT_KEY = "vivrant.gym.programDraft.v1";

export type GymProgramDraft = {
  title: string;
  focus: string;
  level: string;
  summary: string | null;
  recommendations: string[];
  prefs: GymPlanPrefs;
  preview_days: GymPlanDay[];
  kept_days: Record<string, GymPlanDay>;
  training_days: number[];
  updated_at: string;
};

export function weekdayKey(iso: number) {
  return String(iso);
}

export function keptIsoList(kept: Record<string, GymPlanDay> | null | undefined): number[] {
  return parseWeekdayIsos(
    Object.keys(kept ?? {})
      .map((key) => Number(key))
      .filter((n) => Number.isFinite(n)),
    { min: 1, max: 6 },
  );
}

export function remainingTrainingDays(
  trainingDays: number[],
  kept: Record<string, GymPlanDay> | null | undefined,
): number[] {
  const keptSet = new Set(keptIsoList(kept));
  return trainingDays.filter((iso) => !keptSet.has(iso));
}

export function parseKeptDays(raw: unknown): Record<string, GymPlanDay> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, GymPlanDay> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const iso = Math.round(Number(key));
    if (!Number.isFinite(iso) || iso < 1 || iso > 7) continue;
    const parsed = parseGymPlanDays([value]).days[0];
    if (!parsed) continue;
    out[weekdayKey(iso)] = parsed;
  }
  return out;
}

export function parseGymProgramDraft(raw: unknown): GymProgramDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const preview = parseGymPlanDays(row.preview_days).days;
  const kept = parseKeptDays(row.kept_days);
  const trainingDays = sanitizeTrainingDays(
    row.training_days,
    Array.isArray(row.training_days) ? (row.training_days as unknown[]).length : preview.length || 3,
  );
  const recs = clampGymPlanRecommendations(row.recommendations);
  const prefsRaw = row.prefs && typeof row.prefs === "object" ? (row.prefs as GymPlanPrefs) : null;
  return {
    title: String(row.title ?? "Your VIVRΛNT gym program").slice(0, 120),
    focus: String(row.focus ?? "full_body").slice(0, 40),
    level: String(row.level ?? "beginner").slice(0, 20),
    summary: row.summary == null ? null : String(row.summary).slice(0, 600),
    recommendations: recs,
    prefs: prefsRaw ?? {
      days_per_week: trainingDays.length,
      training_days: trainingDays,
      session_minutes: 45,
      level: "beginner",
      known_machine_slugs: [],
      known_custom_exercises: [],
      avoid_targets: [],
    },
    preview_days: preview,
    kept_days: kept,
    training_days: trainingDays,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function stampDayWeekday(day: GymPlanDay, iso: number): GymPlanDay {
  const weekday = GYM_WEEKDAYS.find((item) => item.iso === iso)?.full ?? `Day ${iso}`;
  const focus = humanizeGymLabel(day.focus) || "Training";
  return {
    ...day,
    day: `${weekday} · ${focus}`.slice(0, 40),
  };
}

/** Map generated sessions onto target weekdays, preferring labels already on the day. */
export function mapPreviewToWeekdays(days: GymPlanDay[], targetIsos: number[]): GymPlanDay[] {
  return targetIsos.map((iso, index) => {
    const labeled = days.find((day) => weekdayIsoFromLabel(day.day) === iso);
    const fallback = days[index] ?? days.find((day) => weekdayIsoFromLabel(day.day) == null);
    const source = labeled ?? fallback;
    if (!source) {
      return stampDayWeekday({ day: "Day", focus: "Training", exercises: [] }, iso);
    }
    return stampDayWeekday(source, iso);
  });
}

export function keepPreviewDay(
  draft: GymProgramDraft,
  iso: number,
  day?: GymPlanDay | null,
): GymProgramDraft {
  const source =
    day ??
    draft.preview_days.find((item) => weekdayIsoFromLabel(item.day) === iso) ??
    null;
  if (!source) return draft;
  return {
    ...draft,
    kept_days: {
      ...draft.kept_days,
      [weekdayKey(iso)]: stampDayWeekday(source, iso),
    },
    updated_at: new Date().toISOString(),
  };
}

export function dropKeptDay(draft: GymProgramDraft, iso: number): GymProgramDraft {
  const next = { ...draft.kept_days };
  delete next[weekdayKey(iso)];
  return { ...draft, kept_days: next, updated_at: new Date().toISOString() };
}

function stampNow(draft: GymProgramDraft): GymProgramDraft {
  return { ...draft, updated_at: new Date().toISOString() };
}

export function reorderPreviewExercises(
  draft: GymProgramDraft,
  dayIndex: number,
  from: number,
  to: number,
): GymProgramDraft {
  const preview = draft.preview_days.map((day, index) =>
    index !== dayIndex ? day : { ...day, exercises: movePreview(day.exercises, from, to) },
  );
  return stampNow({ ...draft, preview_days: preview });
}

export function reorderKeptExercises(
  draft: GymProgramDraft,
  iso: number,
  from: number,
  to: number,
): GymProgramDraft {
  const key = weekdayKey(iso);
  const day = draft.kept_days[key];
  if (!day) return draft;
  return stampNow({
    ...draft,
    kept_days: {
      ...draft.kept_days,
      [key]: { ...day, exercises: movePreview(day.exercises, from, to) },
    },
  });
}

/** Swap or move a kept workout onto another weekday slot. */
export function moveKeptDay(draft: GymProgramDraft, fromIso: number, toIso: number): GymProgramDraft {
  if (fromIso === toIso) return draft;
  const fromKey = weekdayKey(fromIso);
  const toKey = weekdayKey(toIso);
  const fromDay = draft.kept_days[fromKey];
  if (!fromDay) return draft;
  const toDay = draft.kept_days[toKey];
  const next = { ...draft.kept_days };
  next[toKey] = stampDayWeekday(fromDay, toIso);
  if (toDay) next[fromKey] = stampDayWeekday(toDay, fromIso);
  else delete next[fromKey];
  return stampNow({ ...draft, kept_days: next });
}

export function replaceKeptDaysFromPlan(draft: GymProgramDraft, days: GymPlanDay[]): GymProgramDraft {
  const kept: Record<string, GymPlanDay> = {};
  const training = draft.training_days.length ? draft.training_days : days.map((_, i) => i + 1);
  days.forEach((day, index) => {
    const iso = weekdayIsoFromLabel(day.day) ?? training[index] ?? index + 1;
    kept[weekdayKey(iso)] = stampDayWeekday(day, iso);
  });
  return stampNow({ ...draft, kept_days: kept });
}

function movePreview<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function assembleKeptPlanDays(draft: GymProgramDraft): GymPlanDay[] {
  const isos = keptIsoList(draft.kept_days);
  return isos.map((iso) => stampDayWeekday(draft.kept_days[weekdayKey(iso)], iso));
}

export type SavedProgramSeed = {
  title?: string | null;
  focus?: string | null;
  level?: string | null;
  summary?: string | null;
  recommendations?: string[];
  days: GymPlanDay[];
  training_days?: number[];
};

export type MergeSavedPlanMode = "fill" | "overwrite";

function clonePlanDay(day: GymPlanDay): GymPlanDay {
  return {
    ...day,
    exercises: (day.exercises ?? []).map((ex) => ({ ...ex })),
    alternatives: day.alternatives?.map((swap) => ({ ...swap })),
    additionals: day.additionals?.map((addon) => ({ ...addon })),
  };
}

function inferTrainingDaysFromPlan(plan: SavedProgramSeed): number[] {
  if (plan.training_days?.length) return sanitizeTrainingDays(plan.training_days, plan.days.length || 3);
  const labeled = plan.days
    .map((day) => weekdayIsoFromLabel(day.day))
    .filter((iso): iso is number => iso != null);
  return sanitizeTrainingDays(labeled.length ? labeled : plan.days.map((_, index) => index + 1), plan.days.length || 3);
}

/** Start a draft week from a saved program so those days can be remixed. */
export function draftFromSavedPlan(
  plan: SavedProgramSeed,
  prefs?: GymPlanPrefs | null,
): GymProgramDraft {
  const trainingDays = inferTrainingDaysFromPlan(plan);
  const kept: Record<string, GymPlanDay> = {};
  plan.days.forEach((day, index) => {
    const iso = weekdayIsoFromLabel(day.day) ?? trainingDays[index];
    if (iso == null || iso < 1 || iso > 7) return;
    kept[weekdayKey(iso)] = stampDayWeekday(clonePlanDay(day), iso);
  });
  const sessionMinutes = prefs?.session_minutes ?? 45;
  return {
    title: String(plan.title ?? "Your VIVRΛNT gym program").slice(0, 120),
    focus: String(plan.focus ?? "full_body").slice(0, 40),
    level: String(plan.level ?? prefs?.level ?? "beginner").slice(0, 20),
    summary: plan.summary == null ? null : String(plan.summary).slice(0, 600),
    recommendations: plan.recommendations ?? [],
    prefs: prefs
      ? {
          ...prefs,
          training_days: trainingDays,
          days_per_week: trainingDays.length,
        }
      : {
          days_per_week: trainingDays.length,
          training_days: trainingDays,
          session_minutes: sessionMinutes,
          level: (plan.level as GymPlanPrefs["level"]) || "beginner",
          known_machine_slugs: [],
          known_custom_exercises: [],
          avoid_targets: [],
        },
    preview_days: [],
    kept_days: kept,
    training_days: trainingDays,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Copy saved-program days onto the current draft.
 * `fill` only occupies empty weekday slots; `overwrite` replaces matching weekdays.
 */
export function mergePlanDaysIntoDraft(
  draft: GymProgramDraft,
  days: GymPlanDay[],
  mode: MergeSavedPlanMode = "fill",
): GymProgramDraft {
  const next = { ...draft.kept_days };
  let training = [...draft.training_days];

  for (const day of days) {
    let iso = weekdayIsoFromLabel(day.day);
    if (iso == null) {
      iso = training.find((slot) => !next[weekdayKey(slot)]) ?? null;
    }
    if (iso == null) continue;
    if (!training.includes(iso)) {
      if (training.length >= 6) {
        iso = training.find((slot) => !next[weekdayKey(slot)]) ?? null;
        if (iso == null) continue;
      } else {
        training = [...training, iso].sort((a, b) => a - b);
      }
    }
    const key = weekdayKey(iso);
    if (mode === "fill" && next[key]) continue;
    next[key] = stampDayWeekday(clonePlanDay(day), iso);
  }

  return stampNow({
    ...draft,
    kept_days: next,
    training_days: training,
    prefs: {
      ...draft.prefs,
      training_days: training,
      days_per_week: training.length,
    },
  });
}

export function summarizeSessionsForAi(days: GymPlanDay[]): string {
  return days
    .map((day) => {
      const moves = (day.exercises ?? [])
        .map((ex) => String(ex.name ?? "").trim())
        .filter(Boolean);
      const focus = humanizeGymLabel(day.focus) || "Training";
      return `- ${day.day || "Day"}: ${focus}${moves.length ? ` (${moves.join(", ")})` : ""}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function collectSessionMoveNames(days: GymPlanDay[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const day of days) {
    for (const ex of day.exercises ?? []) {
      const name = String(ex.name ?? "").trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

export function hydrateDraftPlan(draft: GymProgramDraft) {
  const days = assembleKeptPlanDays(draft);
  return hydrateGymPlan({
    title: draft.title,
    focus: draft.focus,
    level: draft.level,
    days_per_week: days.length || draft.training_days.length,
    summary: draft.summary,
    recommendations: draft.recommendations,
    days,
    created_at: draft.updated_at,
    id: 0,
  });
}

export function newerDraft(
  local: GymProgramDraft | null,
  remote: GymProgramDraft | null,
): GymProgramDraft | null {
  if (!local) return remote;
  if (!remote) return local;
  return Date.parse(remote.updated_at) > Date.parse(local.updated_at) ? remote : local;
}
