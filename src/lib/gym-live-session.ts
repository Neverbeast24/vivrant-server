export const GYM_LIVE_SESSION_KEY = "vivrant.gym.liveSession.v2";

export type GymLiveSessionDraft = {
  plan_id: number;
  day_label: string;
  session_date: string;
  checks: Record<string, boolean[]>;
  names: Record<string, string>;
  weights: Record<string, string>;
  started_at: number | null;
  rest_ends_at: number | null;
  rest_label: string | null;
  rest_total: number | null;
  rest_alerted: boolean;
  updated_at: string;
};

export function todaySessionDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function restRemainingSeconds(restEndsAt: number | null | undefined, now = Date.now()) {
  if (restEndsAt == null || !Number.isFinite(restEndsAt)) return 0;
  return Math.max(0, Math.ceil((restEndsAt - now) / 1000));
}

export function restEndsAtFromSeconds(remaining: number, now = Date.now()) {
  return now + Math.max(0, Math.round(remaining)) * 1000;
}

export function emptyLiveSession(planId: number, dayLabel: string, date = todaySessionDate()): GymLiveSessionDraft {
  return {
    plan_id: planId,
    day_label: dayLabel,
    session_date: date,
    checks: {},
    names: {},
    weights: {},
    started_at: null,
    rest_ends_at: null,
    rest_label: null,
    rest_total: null,
    rest_alerted: false,
    updated_at: new Date().toISOString(),
  };
}

function asBoolList(raw: unknown): boolean[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => Boolean(item));
}

function asStringMap(raw: unknown, max = 80): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .map(([key, value]) => [key, String(value ?? "").slice(0, max)] as const)
      .filter((entry) => entry[1].length > 0),
  );
}

export function parseGymLiveSession(raw: unknown): GymLiveSessionDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const planId = Math.round(Number(row.plan_id ?? row.planId));
  if (!Number.isFinite(planId) || planId <= 0) return null;
  const checksRaw = row.checks && typeof row.checks === "object" ? (row.checks as Record<string, unknown>) : {};
  const started =
    typeof row.started_at === "number"
      ? row.started_at
      : row.started_at
        ? Date.parse(String(row.started_at))
        : typeof row.startedAt === "number"
          ? row.startedAt
          : null;
  const restEnds =
    typeof row.rest_ends_at === "number"
      ? row.rest_ends_at
      : row.rest_ends_at
        ? Date.parse(String(row.rest_ends_at))
        : typeof row.restEndsAt === "number"
          ? row.restEndsAt
          : null;
  const restTotal = Number(row.rest_total ?? row.restTotal);
  return {
    plan_id: planId,
    day_label: String(row.day_label ?? row.day ?? "").slice(0, 80),
    session_date: String(row.session_date ?? row.date ?? todaySessionDate()).slice(0, 10),
    checks: Object.fromEntries(Object.entries(checksRaw).map(([key, value]) => [key, asBoolList(value)])),
    names: asStringMap(row.names, 80),
    weights: asStringMap(row.weights, 40),
    started_at: Number.isFinite(started) && started && started > 0 ? started : null,
    rest_ends_at: Number.isFinite(restEnds) && restEnds && restEnds > 0 ? restEnds : null,
    rest_label: row.rest_label == null && row.restLabel == null ? null : String(row.rest_label ?? row.restLabel).slice(0, 80),
    rest_total: Number.isFinite(restTotal) && restTotal > 0 ? Math.round(restTotal) : null,
    rest_alerted: Boolean(row.rest_alerted ?? row.restAlerted),
    updated_at: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

export function liveSessionMatches(
  draft: GymLiveSessionDraft | null,
  planId: number,
  dayLabel: string,
  date = todaySessionDate(),
) {
  if (!draft) return false;
  return draft.plan_id === planId && draft.day_label === dayLabel && draft.session_date === date;
}

export function newerLiveSession(
  local: GymLiveSessionDraft | null,
  remote: GymLiveSessionDraft | null,
): GymLiveSessionDraft | null {
  if (!local) return remote;
  if (!remote) return local;
  return Date.parse(remote.updated_at) > Date.parse(local.updated_at) ? remote : local;
}

export function liveSessionHasProgress(draft: GymLiveSessionDraft | null) {
  if (!draft) return false;
  if (draft.started_at) return true;
  return Object.values(draft.checks).some((row) => row.some(Boolean));
}

export function serializeLiveSessionForDb(draft: GymLiveSessionDraft) {
  return {
    plan_id: draft.plan_id,
    day_label: draft.day_label,
    session_date: draft.session_date,
    checks: draft.checks,
    names: draft.names,
    weights: draft.weights,
    started_at: draft.started_at ? new Date(draft.started_at).toISOString() : null,
    rest_ends_at: draft.rest_ends_at ? new Date(draft.rest_ends_at).toISOString() : null,
    rest_label: draft.rest_label,
    rest_total: draft.rest_total,
    rest_alerted: draft.rest_alerted,
    updated_at: draft.updated_at,
  };
}
