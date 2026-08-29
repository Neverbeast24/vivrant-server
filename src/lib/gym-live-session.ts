export const GYM_LIVE_SESSION_KEY = "vivrant.gym.liveSession.v2";

export type GymLiveExtraMove = {
  key: string;
  name: string;
  setsLabel: string;
  rest: string;
  setCount: number;
  restSeconds: number;
};

export type GymLiveMoveMeta = {
  setsLabel: string;
  rest: string;
  restSeconds: number;
};

export type GymLiveSessionDraft = {
  plan_id: number;
  day_label: string;
  session_date: string;
  checks: Record<string, boolean[]>;
  names: Record<string, string>;
  weights: Record<string, string>;
  extras: GymLiveExtraMove[];
  removed_keys: string[];
  meta: Record<string, GymLiveMoveMeta>;
  started_at: number | null;
  rest_ends_at: number | null;
  rest_label: string | null;
  rest_total: number | null;
  rest_alerted: boolean;
  rest_kind: "rest" | "work" | null;
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
  return now + Math.max(0, Math.min(10_800, Math.round(remaining))) * 1000;
}

export function emptyLiveSession(planId: number, dayLabel: string, date = todaySessionDate()): GymLiveSessionDraft {
  return {
    plan_id: planId,
    day_label: dayLabel,
    session_date: date,
    checks: {},
    names: {},
    weights: {},
    extras: [],
    removed_keys: [],
    meta: {},
    started_at: null,
    rest_ends_at: null,
    rest_label: null,
    rest_total: null,
    rest_alerted: false,
    rest_kind: null,
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
      .filter(([key]) => !key.startsWith("__"))
      .map(([key, value]) => [key, String(value ?? "").slice(0, max)] as const)
      .filter((entry) => entry[1].length > 0),
  );
}

function asStringList(raw: unknown, max = 40): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? "").slice(0, 80)).filter((item) => item.length > 0).slice(0, max);
}

function parseMeta(raw: unknown): Record<string, GymLiveMoveMeta> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, GymLiveMoveMeta> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const setsLabel = String(row.setsLabel ?? row.sets_label ?? "").slice(0, 40);
    const rest = String(row.rest ?? "").slice(0, 20);
    if (!setsLabel && !rest) continue;
    const restSeconds = Math.max(
      0,
      Math.min(10_800, Math.round(Number(row.restSeconds ?? row.rest_seconds ?? 0)) || 0),
    );
    out[key.slice(0, 40)] = {
      setsLabel: setsLabel || "3 x 10",
      rest: rest || "60s",
      restSeconds,
    };
    if (Object.keys(out).length >= 40) break;
  }
  return out;
}

function parseExtras(raw: unknown): GymLiveExtraMove[] {
  if (!Array.isArray(raw)) return [];
  const out: GymLiveExtraMove[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const key = String(row.key ?? "").slice(0, 40);
    if (!key.startsWith("extra-")) continue;
    const setCount = Math.max(1, Math.min(10, Math.round(Number(row.setCount ?? row.set_count ?? 3)) || 3));
    const restSeconds = Math.max(0, Math.min(10_800, Math.round(Number(row.restSeconds ?? row.rest_seconds ?? 60)) || 0));
    out.push({
      key,
      name: String(row.name ?? "Extra move").slice(0, 80) || "Extra move",
      setsLabel: String(row.setsLabel ?? row.sets_label ?? "3 x 10").slice(0, 40) || "3 x 10",
      rest: String(row.rest ?? "60s").slice(0, 20) || "60s",
      setCount,
      restSeconds,
    });
    if (out.length >= 12) break;
  }
  return out;
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
  const restKindRaw = String(row.rest_kind ?? row.restKind ?? "").toLowerCase();
  let extras = parseExtras(row.extras ?? row.extra_moves);
  if (!extras.length) {
    const namesMap = asStringMap(row.names, 80);
    extras = Object.entries(checksRaw)
      .filter(([key]) => key.startsWith("extra-"))
      .slice(0, 12)
      .map(([key, value]) => {
        const setCount = Math.max(1, asBoolList(value).length || 3);
        const name = namesMap[key] || "Extra move";
        const cardio = /\b(treadmill|elliptical|bike|cycle|row(?:er|ing)?|climber|stair)\b/i.test(name);
        return {
          key,
          name,
          setsLabel: cardio ? "10 mins" : `${setCount} x 10`,
          rest: cardio ? "0s" : "60s",
          setCount: cardio ? 1 : setCount,
          restSeconds: cardio ? 0 : 60,
        };
      });
  }
  const removed = asStringList(row.removed_keys ?? row.removedKeys);
  const meta = parseMeta(row.meta);
  return {
    plan_id: planId,
    day_label: String(row.day_label ?? row.day ?? "").slice(0, 80),
    session_date: String(row.session_date ?? row.date ?? todaySessionDate()).slice(0, 10),
    checks: Object.fromEntries(Object.entries(checksRaw).map(([key, value]) => [key, asBoolList(value)])),
    names: asStringMap(row.names, 80),
    weights: asStringMap(row.weights, 40),
    extras,
    removed_keys: removed,
    meta,
    started_at: Number.isFinite(started) && started && started > 0 ? started : null,
    rest_ends_at: Number.isFinite(restEnds) && restEnds && restEnds > 0 ? restEnds : null,
    rest_label: row.rest_label == null && row.restLabel == null ? null : String(row.rest_label ?? row.restLabel).slice(0, 80),
    rest_total: Number.isFinite(restTotal) && restTotal > 0 ? Math.round(restTotal) : null,
    rest_alerted: Boolean(row.rest_alerted ?? row.restAlerted),
    rest_kind: restKindRaw === "work" || restKindRaw === "rest" ? restKindRaw : null,
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
  if ((draft.extras ?? []).length) return true;
  if ((draft.removed_keys ?? []).length) return true;
  if (draft.meta && Object.keys(draft.meta).length) return true;
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
    extras: draft.extras ?? [],
    removed_keys: draft.removed_keys ?? [],
    meta: draft.meta ?? {},
    started_at: draft.started_at ? new Date(draft.started_at).toISOString() : null,
    rest_ends_at: draft.rest_ends_at ? new Date(draft.rest_ends_at).toISOString() : null,
    rest_label: draft.rest_label,
    rest_total: draft.rest_total,
    rest_alerted: draft.rest_alerted,
    rest_kind: draft.rest_kind ?? null,
    updated_at: draft.updated_at,
  };
}
