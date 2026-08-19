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

export function assembleKeptPlanDays(draft: GymProgramDraft): GymPlanDay[] {
  const isos = keptIsoList(draft.kept_days);
  return isos.map((iso) => stampDayWeekday(draft.kept_days[weekdayKey(iso)], iso));
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
