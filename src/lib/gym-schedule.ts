/** ISO weekdays: 1=Mon … 7=Sun. Used for training-day prefs, plan labels, and reminders. */
export const GYM_WEEKDAYS = [
  { iso: 1, short: "Mon", full: "Monday" },
  { iso: 2, short: "Tue", full: "Tuesday" },
  { iso: 3, short: "Wed", full: "Wednesday" },
  { iso: 4, short: "Thu", full: "Thursday" },
  { iso: 5, short: "Fri", full: "Friday" },
  { iso: 6, short: "Sat", full: "Saturday" },
  { iso: 7, short: "Sun", full: "Sunday" },
] as const;

export type GymWeekdayIso = (typeof GYM_WEEKDAYS)[number]["iso"];

export const SESSION_MINUTE_PRESETS = [30, 45, 60, 75, 90] as const;

/** Spread training days across the week when the member only chose a count. 6 days = Mon–Fri + Sunday. */
export function defaultTrainingDaysFromCount(daysPerWeek: number): number[] {
  const n = Math.min(6, Math.max(2, Math.round(Number(daysPerWeek) || 3)));
  if (n >= 6) return [1, 2, 3, 4, 5, 7];
  if (n === 5) return [1, 2, 3, 4, 5];
  if (n === 4) return [1, 2, 4, 5];
  if (n === 3) return [1, 3, 5];
  return [2, 5];
}

/** Unique ISO weekdays (1–7). Empty / invalid input returns []. */
export function parseWeekdayIsos(
  input: unknown,
  options?: { min?: number; max?: number },
): number[] {
  const min = options?.min ?? 1;
  const max = options?.max ?? 6;
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const raw of input) {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 1 || n > 7 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= max) break;
  }
  out.sort((a, b) => a - b);
  return out.length >= min ? out : [];
}

/** Unique ISO weekdays (1–7), 2–6 long. Empty / invalid input returns []. */
export function parseTrainingDays(input: unknown): number[] {
  return parseWeekdayIsos(input, { min: 2, max: 6 });
}

/** Unique ISO weekdays (1–7), 2–6 long. Falls back to a count-based spread. */
export function sanitizeTrainingDays(input: unknown, fallbackCount = 3): number[] {
  const parsed = parseTrainingDays(input);
  return parsed.length ? parsed : defaultTrainingDaysFromCount(fallbackCount);
}

export function isoWeekdayFromDate(date = new Date()): number {
  const dow = date.getDay();
  return dow === 0 ? 7 : dow;
}

export function weekdayIsoFromLabel(label: string): number | null {
  const raw = String(label ?? "").toLowerCase();
  if (!raw) return null;
  const tokens = raw.split(/[\s,/:.-]+/).filter(Boolean);
  for (const item of GYM_WEEKDAYS) {
    if (raw.includes(item.full.toLowerCase()) || tokens.includes(item.short.toLowerCase())) {
      return item.iso;
    }
  }
  return null;
}

export function trainingDaysFromPlanDays(days: Array<{ day?: string }>): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const day of days) {
    const iso = weekdayIsoFromLabel(String(day.day ?? ""));
    if (iso == null || seen.has(iso)) continue;
    seen.add(iso);
    out.push(iso);
  }
  return out.sort((a, b) => a - b);
}

export function resolveTrainingDays(input: {
  training_days?: unknown;
  days?: Array<{ day?: string }> | null;
  days_per_week?: number | null;
}): number[] {
  const explicit = parseTrainingDays(input.training_days);
  if (explicit.length >= 2) return explicit;
  const labeled = trainingDaysFromPlanDays(input.days ?? []);
  if (labeled.length >= 1) return labeled.slice(0, 6);
  return defaultTrainingDaysFromCount(Number(input.days_per_week ?? input.days?.length ?? 3));
}

/** Reminders follow saved / labeled weekdays when present, else the days/week spread. */
export function reminderDaysFromGymPlan(plan: {
  training_days?: unknown;
  days_per_week?: number | null;
  days?: Array<{ day?: string }> | null;
}): number[] {
  return resolveTrainingDays(plan);
}

/** Compact label like "Mon–Fri, Sun". */
export function formatTrainingDaysLabel(days: number[]): string {
  const parsed = parseTrainingDays(days);
  const sorted = parsed.length ? parsed : [...days].filter((n) => n >= 1 && n <= 7).sort((a, b) => a - b);
  if (!sorted.length) return "";
  if (sorted.length === 7) return "Every day";
  const names = GYM_WEEKDAYS.map((wd) => wd.short);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  const flush = () => {
    if (start === prev) parts.push(names[start - 1] ?? "");
    else if (prev - start === 1) parts.push(`${names[start - 1]}, ${names[prev - 1]}`);
    else parts.push(`${names[start - 1]}–${names[prev - 1]}`);
  };
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    flush();
    start = prev = sorted[i];
  }
  flush();
  return parts.filter(Boolean).join(", ");
}

export function formatRestDaysLabel(trainingDays: number[]): string {
  const selected = new Set(trainingDays);
  const rest = GYM_WEEKDAYS.filter((item) => !selected.has(item.iso)).map((item) => item.short);
  if (!rest.length) return "";
  if (rest.length === 1) return `Rest ${rest[0]}`;
  if (rest.length === 2) return `Rest ${rest[0]} & ${rest[1]}`;
  return `Rest ${rest.slice(0, -1).join(", ")} & ${rest[rest.length - 1]}`;
}

export function nextTrainingDayHint(trainingDays: number[], date = new Date()): string | null {
  const schedule = sanitizeTrainingDays(trainingDays, trainingDays.length);
  if (!schedule.length) return null;
  const todayIso = isoWeekdayFromDate(date);
  for (let offset = 1; offset <= 7; offset++) {
    const iso = ((todayIso - 1 + offset) % 7) + 1;
    if (!schedule.includes(iso)) continue;
    const name = GYM_WEEKDAYS.find((wd) => wd.iso === iso)?.full ?? "your next session";
    if (offset === 1) return "Tomorrow";
    return name;
  }
  return null;
}
