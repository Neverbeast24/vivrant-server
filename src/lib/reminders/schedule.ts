/** Compute next fire time for a weekly schedule in a given IANA timezone. */

export type ReminderScheduleInput = {
  scheduleTime: string; // HH:MM or HH:MM:SS
  daysOfWeek: number[]; // 1=Mon … 7=Sun (ISO)
  timezone?: string;
  from?: Date;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local calendar parts in a timezone. */
export function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    isoWeekday: weekdayMap[parts.weekday ?? "Mon"] ?? 1,
  };
}

/** Approximate instant for a local wall time in a timezone (good enough for reminders). */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = zonedParts(guess, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(guess.getTime() + (wanted - asUtc));
}

export function parseScheduleTime(scheduleTime: string) {
  const [h = "9", m = "0"] = scheduleTime.split(":");
  return {
    hour: Math.min(23, Math.max(0, Number(h) || 0)),
    minute: Math.min(59, Math.max(0, Number(m) || 0)),
  };
}

export function computeNextFireAt(input: ReminderScheduleInput): Date {
  const timeZone = input.timezone || "Asia/Manila";
  const from = input.from ?? new Date();
  const { hour, minute } = parseScheduleTime(input.scheduleTime);
  const days = (input.daysOfWeek?.length ? input.daysOfWeek : [1, 2, 3, 4, 5, 6, 7])
    .map((d) => Math.min(7, Math.max(1, Math.round(d))))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort((a, b) => a - b);

  for (let offset = 0; offset < 8; offset++) {
    const probe = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    const parts = zonedParts(probe, timeZone);
    if (!days.includes(parts.isoWeekday)) continue;
    const candidate = zonedLocalToUtc(parts.year, parts.month, parts.day, hour, minute, timeZone);
    if (candidate.getTime() > from.getTime() + 30_000) return candidate;
  }

  // Fallback: tomorrow at schedule time
  const tomorrow = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const p = zonedParts(tomorrow, timeZone);
  return zonedLocalToUtc(p.year, p.month, p.day, hour, minute, timeZone);
}

export function formatScheduleLabel(scheduleTime: string, daysOfWeek: number[]) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = [...daysOfWeek].sort((a, b) => a - b);
  const label =
    days.length === 7
      ? "Every day"
      : days.map((d) => dayNames[d - 1]).join(", ");
  const { hour, minute } = parseScheduleTime(scheduleTime);
  return `${label} · ${pad(hour)}:${pad(minute)}`;
}
