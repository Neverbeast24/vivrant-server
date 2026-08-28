"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Repeat2, Timer, X } from "lucide-react";
import { toast } from "sonner";
import {
  clearGymLiveSessionAction,
  loadGymLiveSessionAction,
  logProgramGymSession,
  saveGymLiveSessionAction,
  updateGymPlan,
} from "@/app/dashboard/gym/actions";
import { EmptyState, Panel, PrimaryButton } from "@/components/dashboard/ui";
import { GymMovePicker } from "@/components/dashboard/gym-move-picker";
import {
  formatRestClock,
  formatGymMoveName,
  gymSessionFocusFromPlan,
  GYM_WEEKDAYS,
  humanizeGymLabel,
  isCardioGymMove,
  moveSavedPlanDay,
  nextGymMovePrescription,
  parseRestSeconds,
  parseSetCount,
  parseTimedMinutes,
  pickTodaysPlanDay,
  resolveSessionMoveWeight,
  resolveSessionPlanDay,
  trainingDaysFromPlanDays,
  weekdayIsoFromLabel,
  type GymMoveCatalogItem,
  type GymPlan,
  type GymPlanDay,
} from "@/lib/gym";
import {
  GYM_LIVE_SESSION_KEY,
  liveSessionHasProgress,
  liveSessionMatches,
  newerLiveSession,
  parseGymLiveSession,
  restEndsAtFromSeconds,
  restRemainingSeconds,
  todaySessionDate,
  type GymLiveExtraMove,
  type GymLiveSessionDraft,
} from "@/lib/gym-live-session";
import {
  cancelGymRestAlarm,
  playGymRestAlarm,
  requestGymRestNotifyPermission,
  scheduleGymRestAlarm,
  unlockGymRestAlert,
} from "@/lib/gym-rest-alert";

type RunnerItem = {
  key: string;
  name: string;
  originalName: string;
  setsLabel: string;
  rest: string;
  restSeconds: number;
  setCount: number;
  weight?: string;
  notes?: string;
  kind: "main" | "addon";
  swap?: string;
};

type RestState = {
  label: string;
  total: number;
  endsAt: number;
  alerted: boolean;
  kind: "rest" | "work";
};

type MoveMeta = {
  setsLabel: string;
  rest: string;
  restSeconds: number;
};

function readLocalLiveSession(): GymLiveSessionDraft | null {
  try {
    const raw = localStorage.getItem(GYM_LIVE_SESSION_KEY);
    return raw ? parseGymLiveSession(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocalLiveSession(draft: GymLiveSessionDraft | null) {
  try {
    if (!draft) localStorage.removeItem(GYM_LIVE_SESSION_KEY);
    else localStorage.setItem(GYM_LIVE_SESSION_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

function buildItems(day: GymPlanDay): RunnerItem[] {
  const mains: RunnerItem[] = (day.exercises ?? []).map((ex, index) => ({
    key: `main-${index}`,
    name: formatGymMoveName(ex.name) || ex.name,
    originalName: formatGymMoveName(ex.name) || ex.name,
    setsLabel: ex.sets,
    rest: ex.rest,
    restSeconds: parseRestSeconds(ex.rest),
    setCount: parseSetCount(ex.sets),
    weight: ex.weight,
    notes: ex.notes,
    kind: "main",
    swap: (day.alternatives ?? []).find(
      (alt) => alt.instead_of.toLowerCase() === ex.name.toLowerCase(),
    )?.use,
  }));
  const addons: RunnerItem[] = (day.additionals ?? []).map((addon, index) => ({
    key: `addon-${index}`,
    name: formatGymMoveName(addon.name) || addon.name,
    originalName: formatGymMoveName(addon.name) || addon.name,
    setsLabel: addon.sets ?? "2 x 12",
    rest: "45s",
    restSeconds: 45,
    setCount: parseSetCount(addon.sets ?? "2 x 12"),
    kind: "addon",
  }));
  return [...mains, ...addons];
}

function extraFromDraft(row: GymLiveExtraMove): RunnerItem {
  return {
    key: row.key,
    name: row.name || "Extra move",
    originalName: row.name || "Extra move",
    setsLabel: row.setsLabel || "3 x 10",
    rest: row.rest || "60s",
    restSeconds: row.restSeconds,
    setCount: Math.max(1, row.setCount),
    kind: "addon",
  };
}

function extraToDraft(item: RunnerItem, name: string, meta?: MoveMeta): GymLiveExtraMove {
  return {
    key: item.key,
    name,
    setsLabel: meta?.setsLabel ?? item.setsLabel,
    rest: meta?.rest ?? item.rest,
    setCount: item.setCount,
    restSeconds: meta?.restSeconds ?? item.restSeconds,
  };
}

function repsFromSets(sets: string) {
  const match = String(sets).match(/[x×]\s*(\d+(?:\s*[-–]\s*\d+)?)/i);
  return match?.[1]?.replace(/\s+/g, "") || "10";
}

function emptyChecks(items: RunnerItem[]) {
  return Object.fromEntries(items.map((item) => [item.key, Array.from({ length: item.setCount }, () => false)]));
}

export function ProgramSessionPanel({
  plans,
  compact = false,
  allowDayPick = true,
  initialPlanId,
  initialDayLabel,
  moveOptions = [],
  bodyWeightKg = null,
}: {
  plans: GymPlan[];
  compact?: boolean;
  allowDayPick?: boolean;
  initialPlanId?: number;
  initialDayLabel?: string;
  moveOptions?: GymMoveCatalogItem[];
  bodyWeightKg?: number | null;
}) {
  const [planId, setPlanId] = useState(() => {
    if (initialPlanId && plans.some((item) => item.id === initialPlanId)) return initialPlanId;
    return plans[0]?.id ?? 0;
  });
  const [dayLabel, setDayLabel] = useState(initialDayLabel ?? "");
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [rest, setRest] = useState<RestState | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, startSave] = useTransition();
  const [restored, setRestored] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [extras, setExtras] = useState<RunnerItem[]>([]);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, MoveMeta>>({});
  const syncTimer = useRef<number | null>(null);
  const alarmGuard = useRef(false);
  const router = useRouter();

  const plan = plans.find((item) => item.id === planId) ?? plans[0] ?? null;
  const loadHint = {
    level: plan?.level,
    bodyWeightKg,
    catalog: moveOptions,
  };
  const calendarToday = plan ? pickTodaysPlanDay(plan.days ?? [], new Date(), plan.training_days) : null;
  const sessionDay = plan
    ? resolveSessionPlanDay(plan.days ?? [], {
        label: allowDayPick ? dayLabel : null,
        trainingDays: plan.training_days,
      })
    : null;
  const items = useMemo(() => {
    const base = [...(sessionDay ? buildItems(sessionDay) : []), ...extras].filter(
      (item) => !removedKeys.includes(item.key),
    );
    return base.map((item) => {
      const over = meta[item.key];
      const row = checks[item.key];
      const setCount = Math.max(over ? parseSetCount(over.setsLabel) : item.setCount, row?.length ?? 0, 1);
      return {
        ...item,
        ...(over ?? {}),
        setCount,
      };
    });
  }, [checks, extras, meta, removedKeys, sessionDay]);

  useEffect(() => {
    let cancelled = false;
    if (!plan || !sessionDay) {
      queueMicrotask(() => {
        if (cancelled) return;
        setChecks({});
        setNames({});
        setWeights({});
        setRest(null);
        setRestored(false);
        setExtras([]);
        setRemovedKeys([]);
        setMeta({});
        setHydrated(true);
      });
      return () => {
        cancelled = true;
      };
    }
    const nextItems = buildItems(sessionDay);
    const nextNames = Object.fromEntries(nextItems.map((item) => [item.key, item.name]));
    const applyDraft = (saved: GymLiveSessionDraft | null) => {
      if (cancelled) return;
      const restoredExtras: RunnerItem[] = (saved?.extras ?? []).map((row) => extraFromDraft(row));
      const removed = saved?.removed_keys ?? [];
      const visibleBase = nextItems.filter((item) => !removed.includes(item.key));
      const visible = [...visibleBase, ...restoredExtras];
      let nextChecks = emptyChecks(visible);
      const namesOut = { ...nextNames };
      const weightsOut = Object.fromEntries(
        visible.map((item) => [
          item.key,
          resolveSessionMoveWeight(item.name, item.weight, undefined, {
            level: plan.level,
            bodyWeightKg,
            catalog: moveOptions,
          }),
        ]),
      );
      const metaOut: Record<string, MoveMeta> = {};
      if (saved && liveSessionMatches(saved, plan.id, sessionDay.day)) {
        nextChecks = Object.fromEntries(
          visible.map((item) => {
            const row = saved.checks[item.key];
            const count = Math.max(item.setCount, Array.isArray(row) ? row.length : 0, 1);
            return [item.key, Array.from({ length: count }, (_, i) => Boolean(row?.[i]))];
          }),
        );
        for (const item of visible) {
          if (saved.names[item.key]) namesOut[item.key] = saved.names[item.key];
          weightsOut[item.key] = resolveSessionMoveWeight(
            namesOut[item.key] ?? item.name,
            item.weight,
            saved.weights?.[item.key],
            { level: plan.level, bodyWeightKg, catalog: moveOptions },
          );
          const extra = restoredExtras.find((row) => row.key === item.key);
          if (extra) {
            metaOut[item.key] = {
              setsLabel: extra.setsLabel,
              rest: extra.rest,
              restSeconds: extra.restSeconds,
            };
          }
        }
        setStartedAt(saved.started_at);
        const remaining = restRemainingSeconds(saved.rest_ends_at);
        if (remaining > 0 && saved.rest_ends_at) {
          alarmGuard.current = false;
          setRest({
            label: saved.rest_label ?? "Rest",
            total: saved.rest_total ?? remaining,
            endsAt: saved.rest_ends_at,
            alerted: Boolean(saved.rest_alerted),
            kind: saved.rest_kind === "work" ? "work" : "rest",
          });
          scheduleGymRestAlarm(remaining, saved.rest_label ?? undefined);
        } else if (saved.rest_ends_at && remaining <= 0 && !saved.rest_alerted) {
          setRest(null);
          void playGymRestAlarm(saved.rest_label ?? undefined);
          toast.success(saved.rest_kind === "work" ? "Time’s up — nice work." : "Rest done — next set.");
        } else {
          setRest(null);
        }
        setRestored(liveSessionHasProgress(saved));
        setExtras(restoredExtras);
        setRemovedKeys(removed);
        setMeta(metaOut);
      } else {
        setStartedAt(null);
        setRest(null);
        setRestored(false);
        setExtras([]);
        setRemovedKeys([]);
        setMeta({});
      }
      setChecks(nextChecks);
      setNames(namesOut);
      setWeights(weightsOut);
      setHydrated(true);
    };

    const local = readLocalLiveSession();
    queueMicrotask(() => {
      if (cancelled) return;
      applyDraft(liveSessionMatches(local, plan.id, sessionDay.day) ? local : null);
    });

    void (async () => {
      try {
        const remote = await loadGymLiveSessionAction();
        if (cancelled || !remote.ok) return;
        const merged = newerLiveSession(
          liveSessionMatches(local, plan.id, sessionDay.day) ? local : null,
          remote.session,
        );
        if (merged && liveSessionMatches(merged, plan.id, sessionDay.day)) {
          applyDraft(merged);
        }
      } catch {
        // offline — local draft is enough
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan?.id, sessionDay?.day, plan?.level, bodyWeightKg]);

  useEffect(() => {
    if (!hydrated || !plan || !sessionDay || !Object.keys(checks).length) return;
    const extraDrafts = extras.map((item) => extraToDraft(item, names[item.key] ?? item.name, meta[item.key]));
    const draft: GymLiveSessionDraft = {
      plan_id: plan.id,
      day_label: sessionDay.day,
      session_date: todaySessionDate(),
      checks,
      names,
      weights,
      extras: extraDrafts,
      removed_keys: removedKeys,
      started_at: startedAt,
      rest_ends_at: rest?.endsAt ?? null,
      rest_label: rest?.label ?? null,
      rest_total: rest?.total ?? null,
      rest_alerted: rest?.alerted ?? false,
      rest_kind: rest?.kind ?? null,
      updated_at: new Date().toISOString(),
    };
    writeLocalLiveSession(draft);
    if (!liveSessionHasProgress(draft) && !draft.rest_ends_at && !extraDrafts.length && !removedKeys.length) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      void saveGymLiveSessionAction(draft);
    }, 600);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [checks, extras, hydrated, meta, names, plan, removedKeys, rest, startedAt, sessionDay, weights]);

  useEffect(() => {
    if (!startedAt && !rest) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [rest?.endsAt, startedAt]);

  useEffect(() => {
    if (!rest) {
      alarmGuard.current = false;
      return;
    }
    const tick = () => {
      const remaining = restRemainingSeconds(rest.endsAt);
      setNowTick(Date.now());
      if (remaining <= 0 && !rest.alerted && !alarmGuard.current) {
        alarmGuard.current = true;
        void playGymRestAlarm(rest.label);
        toast.success(rest.kind === "work" ? "Time’s up — nice work." : "Rest done — next set.");
        setRest(null);
      }
    };
    const id = window.setInterval(tick, 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    queueMicrotask(tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [rest?.endsAt, rest?.alerted, rest?.kind, rest?.label]);

  const doneCount = items.reduce(
    (sum, item) => sum + (checks[item.key] ?? []).filter(Boolean).length,
    0,
  );
  const totalCount = items.reduce((sum, item) => sum + item.setCount, 0);
  const restRemaining = rest ? restRemainingSeconds(rest.endsAt, nowTick) : 0;
  const elapsedMinutes = startedAt
    ? Math.max(5, Math.round((nowTick - startedAt) / 60_000))
    : 45;

  function markStarted() {
    setStartedAt((current) => current ?? Date.now());
  }

  function startRest(label: string, seconds: number, kind: "rest" | "work" = "rest") {
    if (seconds <= 0) return;
    alarmGuard.current = false;
    unlockGymRestAlert();
    requestGymRestNotifyPermission();
    const endsAt = restEndsAtFromSeconds(seconds);
    setRest({
      label,
      total: seconds,
      endsAt,
      alerted: false,
      kind,
    });
    scheduleGymRestAlarm(seconds, label);
  }

  function skipRest() {
    cancelGymRestAlarm();
    alarmGuard.current = true;
    setRest(null);
  }

  function toggleSet(item: RunnerItem, index: number) {
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    const nextValue = !current[index];
    const next = current.map((value, i) => (i === index ? nextValue : value));
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    if (!nextValue) return;
    markStarted();
    const displayName = names[item.key] ?? item.name;
    const timed = parseTimedMinutes(meta[item.key]?.setsLabel ?? item.setsLabel);
    if (timed && isCardioGymMove(displayName)) {
      startRest(displayName, timed * 60, "work");
      return;
    }
    const remainingSets = items.some((row) => {
      const rowChecks = row.key === item.key ? next : checks[row.key] ?? [];
      return rowChecks.some((value) => !value);
    });
    if (item.restSeconds > 0 && remainingSets) {
      startRest(displayName, item.restSeconds, "rest");
    }
  }

  function toggleExercise(item: RunnerItem) {
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    const allOn = current.every(Boolean);
    const next = current.map(() => !allOn);
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    if (allOn) return;
    markStarted();
    const displayName = names[item.key] ?? item.name;
    const timed = parseTimedMinutes(meta[item.key]?.setsLabel ?? item.setsLabel);
    if (timed && isCardioGymMove(displayName)) {
      startRest(displayName, timed * 60, "work");
      return;
    }
    startRest(displayName, item.restSeconds, "rest");
  }

  function applyMoveName(item: RunnerItem, name: string) {
    const previous = names[item.key] ?? item.name;
    const next = nextGymMovePrescription(
      name,
      {
        sets: meta[item.key]?.setsLabel ?? item.setsLabel,
        rest: meta[item.key]?.rest ?? item.rest,
        weight: weights[item.key],
      },
      previous,
      loadHint,
    );
    const restSeconds = parseRestSeconds(next.rest);
    const setCount = parseSetCount(next.sets);
    setNames((current) => ({ ...current, [item.key]: name }));
    setWeights((current) => ({ ...current, [item.key]: next.weight }));
    setMeta((current) => ({
      ...current,
      [item.key]: { setsLabel: next.sets, rest: next.rest, restSeconds },
    }));
    setChecks((current) => {
      const row = current[item.key] ?? [];
      if (row.length === setCount) return current;
      return {
        ...current,
        [item.key]: Array.from({ length: setCount }, (_, i) => Boolean(row[i])),
      };
    });
    if (item.key.startsWith("extra-")) {
      setExtras((current) =>
        current.map((row) =>
          row.key === item.key
            ? { ...row, name, originalName: name, setsLabel: next.sets, rest: next.rest, restSeconds, setCount }
            : row,
        ),
      );
    }
  }

  function swapItem(item: RunnerItem) {
    if (!item.swap) return;
    const current = names[item.key] ?? item.name;
    const next = current === item.originalName ? item.swap : item.originalName;
    applyMoveName(item, next);
  }

  function addExtra() {
    const key = `extra-${Date.now()}`;
    const item: RunnerItem = {
      key,
      name: "Extra move",
      originalName: "Extra move",
      setsLabel: "3 x 10",
      rest: "60s",
      restSeconds: 60,
      setCount: 3,
      kind: "addon",
    };
    setExtras((current) => [...current, item]);
    setChecks((current) => ({ ...current, [key]: [false, false, false] }));
    setNames((current) => ({ ...current, [key]: "Extra move" }));
    setWeights((current) => ({ ...current, [key]: "" }));
    setMeta((current) => ({ ...current, [key]: { setsLabel: "3 x 10", rest: "60s", restSeconds: 60 } }));
  }

  function removeMove(item: RunnerItem) {
    setChecks((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    setNames((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    setWeights((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    setMeta((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    if (item.key.startsWith("extra-")) {
      setExtras((current) => current.filter((row) => row.key !== item.key));
    } else {
      setRemovedKeys((current) => (current.includes(item.key) ? current : [...current, item.key]));
    }
  }

  function addSet(item: RunnerItem) {
    if (parseTimedMinutes(meta[item.key]?.setsLabel ?? item.setsLabel) != null) {
      nudgeMinutes(item, 5);
      return;
    }
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    if (current.length >= 10) return;
    const next = [...current, false];
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    const setsLabel = `${next.length} x ${repsFromSets(meta[item.key]?.setsLabel ?? item.setsLabel)}`;
    const rest = meta[item.key]?.rest ?? item.rest;
    setMeta((prev) => ({
      ...prev,
      [item.key]: { setsLabel, rest, restSeconds: parseRestSeconds(rest) },
    }));
    if (item.key.startsWith("extra-")) {
      setExtras((rows) =>
        rows.map((row) => (row.key === item.key ? { ...row, setsLabel, setCount: next.length } : row)),
      );
    }
  }

  function nudgeMinutes(item: RunnerItem, delta: number) {
    const current = parseTimedMinutes(meta[item.key]?.setsLabel ?? item.setsLabel) ?? 10;
    const next = Math.max(5, Math.min(90, current + delta));
    const setsLabel = `${next} mins`;
    const rest = "0s";
    setMeta((prev) => ({ ...prev, [item.key]: { setsLabel, rest, restSeconds: 0 } }));
    setChecks((prev) => ({ ...prev, [item.key]: prev[item.key]?.length ? prev[item.key] : [false] }));
    if (item.key.startsWith("extra-")) {
      setExtras((rows) =>
        rows.map((row) =>
          row.key === item.key ? { ...row, setsLabel, rest, restSeconds: 0, setCount: 1 } : row,
        ),
      );
    }
  }

  function persistMove(toIso: number) {
    if (!plan || !sessionDay) return;
    const fromIndex = (plan.days ?? []).findIndex((item) => item.day === sessionDay.day);
    if (fromIndex < 0) return;
    const days = moveSavedPlanDay(plan.days ?? [], fromIndex, toIso);
    const training = trainingDaysFromPlanDays(days);
    startSave(async () => {
      const result = await updateGymPlan({
        id: plan.id,
        title: plan.title,
        summary: plan.summary ?? "",
        focus: plan.focus,
        level: plan.level,
        days,
        recommendations: plan.recommendations,
        training_days: training.length ? training : plan.training_days,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Moved that workout to a new weekday.");
      const moved = days.find((item) => weekdayIsoFromLabel(item.day) === toIso);
      if (moved) setDayLabel(moved.day);
      router.refresh();
    });
  }

  function save() {
    if (!plan || !sessionDay) return;
    const logged = items
      .map((item) => {
        const row = checks[item.key] ?? [];
        const completed = row.filter(Boolean).length;
        if (!completed) return null;
        return {
          name: names[item.key] ?? item.name,
          sets: meta[item.key]?.setsLabel ?? item.setsLabel,
          rest: meta[item.key]?.rest ?? item.rest,
          ...((weights[item.key] ?? item.weight) ? { weight: weights[item.key] ?? item.weight } : {}),
          done: completed >= item.setCount,
          completed_sets: completed,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
    if (!logged.length) {
      toast.error("Check off at least one set, then save.");
      return;
    }
    startSave(async () => {
      const minutes = startedAt
        ? Math.min(180, Math.max(5, Math.round((Date.now() - startedAt) / 60_000)))
        : 45;
      const result = await logProgramGymSession({
        title: `${sessionDay.day}: ${humanizeGymLabel(sessionDay.focus)}`,
        focus: gymSessionFocusFromPlan(sessionDay.focus),
        duration_minutes: minutes,
        notes: `From program: ${plan.title}`,
        exercises: logged,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setChecks(emptyChecks(items));
      setStartedAt(null);
      setRest(null);
      setRestored(false);
      writeLocalLiveSession(null);
      void clearGymLiveSessionAction();
    });
  }

  if (!plans.length) {
    return (
      <Panel title="Today’s program" className={compact ? "mb-4" : ""}>
        <EmptyState>
          Create a weekly program first — then today’s exercises show up here with checkboxes and a rest
          timer.{" "}
          <Link href="/dashboard/gym/plans" className="font-black text-accent underline-offset-2 hover:underline">
            Create a program
          </Link>
        </EmptyState>
      </Panel>
    );
  }

  if (!plan || !sessionDay) {
    return (
      <Panel title={allowDayPick ? "Saved program day" : "Today’s program"} className={compact ? "mb-4" : ""}>
        {allowDayPick && plan && (plan.days ?? []).length > 0 ? (
          <div>
            <p className="mb-3 text-sm text-muted">
              Rest day on the calendar — pick a saved day to train anyway.
            </p>
            <label className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
                Start a saved day
              </span>
              <select
                value=""
                onChange={(event) => setDayLabel(event.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-sm outline-none focus:border-accent/45"
              >
                <option value="" disabled>
                  Choose a day
                </option>
                {(plan.days ?? []).map((day) => (
                  <option key={day.day} value={day.day}>
                    {day.day} · {humanizeGymLabel(day.focus)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <EmptyState>
            Rest day — no gym session on your schedule today. Enjoy recovery, or log a walk below.
          </EmptyState>
        )}
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title={allowDayPick ? "Program session" : "Today’s program"}
        className={compact ? "mb-4" : ""}
        right={
          <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-black text-accent">
            {doneCount}/{totalCount} sets
          </span>
        }
      >
        <p className="mb-3 text-sm leading-6 text-muted">
          Check off each set. Rest starts automatically from the program (skip anytime). Swipe a
          move left or right to remove it. Close the tab anytime — your sets and rest timer come
          back. Save when you are done.
        </p>
        {restored && (
          <p className="mb-3 rounded-2xl border border-accent/20 bg-accent-soft/50 px-3.5 py-2 text-xs font-black text-accent">
            Restored your in-progress workout.
          </p>
        )}
        {plans.length > 1 && (
          <label className="mb-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
              Program
            </span>
            <select
              value={plan.id}
              onChange={(event) => {
                setPlanId(Number(event.target.value));
                setDayLabel("");
              }}
              className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-sm outline-none focus:border-accent/45"
            >
              {plans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {allowDayPick && (plan.days ?? []).length > 1 && (
          <label className="mb-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
              Day
            </span>
            <select
              value={sessionDay.day}
              onChange={(event) => setDayLabel(event.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-sm outline-none focus:border-accent/45"
            >
              {(plan.days ?? []).map((day) => (
                <option key={day.day} value={day.day}>
                  {day.day} · {humanizeGymLabel(day.focus)}
                  {calendarToday?.day === day.day ? " · today" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="mb-3 block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
            Move this workout to
          </span>
          <select
            value={weekdayIsoFromLabel(sessionDay.day) ?? ""}
            disabled={saving}
            onChange={(event) => persistMove(Number(event.target.value))}
            className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-sm outline-none focus:border-accent/45"
          >
            <option value="" disabled>
              Keep on {sessionDay.day}
            </option>
            {GYM_WEEKDAYS.map((item) => (
              <option key={item.iso} value={item.iso}>
                {item.full}
                {weekdayIsoFromLabel(sessionDay.day) === item.iso ? " · current" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="mb-3 rounded-2xl border border-accent/15 bg-accent-soft/50 px-3.5 py-3">
          <p className="text-[11px] font-black text-accent">
            {sessionDay.day} · {humanizeGymLabel(sessionDay.focus)}
            {calendarToday?.day === sessionDay.day ? " · today" : ""}
          </p>
          <p className="mt-0.5 text-sm font-black">{plan.title}</p>
        </div>

        {rest && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-inverse px-4 py-3 text-inverse-fg">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-inverse-fg/70">
                {rest.kind === "work" ? "Work" : "Rest"} · {rest.label}
              </p>
              <p className="font-display text-3xl leading-none">{formatRestClock(restRemaining)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-inverse-fg/20 sm:w-24">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(4, (restRemaining / Math.max(rest.total, 1)) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={skipRest}
                className="inline-flex items-center gap-1 rounded-full bg-inverse-fg/12 px-3 py-1.5 text-[11px] font-black"
              >
                <X size={12} /> Skip
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const row = checks[item.key] ?? [];
            const complete = row.length > 0 && row.every(Boolean);
            const displayName = names[item.key] ?? item.name;
            const setsLabel = meta[item.key]?.setsLabel ?? item.setsLabel;
            const timed = parseTimedMinutes(setsLabel);
            const cardio = isCardioGymMove(displayName);
            return (
              <SwipeRemove key={item.key} onRemove={() => removeMove(item)} label={displayName}>
                <article
                  className={`rounded-2xl border p-3 ${
                    complete ? "border-accent/30 bg-accent-soft/40" : "border-ink/8 bg-surface/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={complete}
                      onClick={() => toggleExercise(item)}
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border transition ${
                        complete
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-ink/20 bg-card text-transparent hover:border-accent/50"
                      }`}
                      aria-label={`Mark ${displayName} complete`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="min-w-0 flex-1">
                          <GymMovePicker
                            value={displayName === "Extra move" ? "" : displayName}
                            onChange={(name) => applyMoveName(item, name)}
                            options={moveOptions}
                            className="min-w-0 w-full rounded-lg border border-ink/10 bg-card px-2 py-1 text-sm font-black outline-none focus:border-accent/45"
                            placeholder="Search moves…"
                            aria-label={item.key.startsWith("extra-") ? "Extra move name" : "Move name"}
                          />
                        </div>
                        {item.kind === "addon" && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-black text-muted">
                            Extra
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                        <span>{setsLabel}</span>
                        <span aria-hidden>·</span>
                        <input
                          value={weights[item.key] ?? item.weight ?? ""}
                          onChange={(event) =>
                            setWeights((current) => ({
                              ...current,
                              [item.key]: event.target.value.slice(0, 40),
                            }))
                          }
                          placeholder={cardio ? "Pace" : "Weight"}
                          maxLength={40}
                          aria-label={`${displayName} ${cardio ? "pace" : "weight"}`}
                          className="w-[7.5rem] rounded-lg border border-ink/10 bg-card px-2 py-0.5 text-xs font-semibold text-ink outline-none placeholder:text-muted focus:border-accent/45"
                        />
                        {item.restSeconds ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>rest {meta[item.key]?.rest ?? item.rest}</span>
                          </>
                        ) : null}
                      </p>
                      {item.notes && <p className="mt-1 text-[11px] leading-4 text-muted">{item.notes}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {timed != null ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleSet(item, 0)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition ${
                                row[0]
                                  ? "border-accent/40 bg-accent text-accent-fg"
                                  : "border-ink/10 bg-card text-muted hover:border-accent/30 hover:text-ink"
                              }`}
                            >
                              {row[0] ? `${timed} min done` : `Start ${timed} min`}
                            </button>
                            <button
                              type="button"
                              onClick={() => nudgeMinutes(item, -5)}
                              className="rounded-full border border-ink/10 bg-card px-2 py-1 text-[11px] font-black text-muted"
                              aria-label="Fewer minutes"
                            >
                              −5
                            </button>
                            <button
                              type="button"
                              onClick={() => nudgeMinutes(item, 5)}
                              className="rounded-full border border-ink/10 bg-card px-2 py-1 text-[11px] font-black text-muted"
                              aria-label="More minutes"
                            >
                              +5
                            </button>
                          </>
                        ) : (
                          <>
                            {row.map((on, index) => (
                              <button
                                key={`${item.key}-set-${index}`}
                                type="button"
                                onClick={() => toggleSet(item, index)}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition ${
                                  on
                                    ? "border-accent/40 bg-accent text-accent-fg"
                                    : "border-ink/10 bg-card text-muted hover:border-accent/30 hover:text-ink"
                                }`}
                              >
                                Set {index + 1}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => addSet(item)}
                              className="rounded-full border border-dashed border-accent/30 bg-card px-2.5 py-1 text-[11px] font-black text-accent"
                            >
                              + Set
                            </button>
                          </>
                        )}
                      </div>
                      {item.swap && (
                        <button
                          type="button"
                          onClick={() => swapItem(item)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-accent"
                        >
                          <Repeat2 size={12} />
                          {displayName === item.originalName ? `Swap for ${item.swap}` : `Back to ${item.originalName}`}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </SwipeRemove>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addExtra}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-accent"
        >
          <Plus size={12} />
          Add a move
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrimaryButton disabled={saving || doneCount === 0} onClick={save}>
            {saving ? "Saving…" : `Save workout · ${elapsedMinutes} min`}
          </PrimaryButton>
          <p className="text-xs text-muted">
            {startedAt ? "Time counted from your first set." : "Timer starts when you check the first set."}
          </p>
        </div>
      </Panel>

      {rest && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-inverse px-4 py-3 text-inverse-fg shadow-lg sm:hidden">
          <span className="inline-flex items-center gap-2 text-sm font-black">
            <Timer size={16} /> {formatRestClock(restRemaining)}
          </span>
          <button type="button" onClick={skipRest} className="text-[11px] font-black">
            Skip rest
          </button>
        </div>
      )}
    </>
  );
}

function SwipeRemove({
  onRemove,
  label,
  children,
}: {
  onRemove: () => void;
  label: string;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dxRef = useRef(0);
  const dragging = useRef(false);
  const axisLock = useRef<"x" | "y" | null>(null);
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    start.current = null;
    dragging.current = false;
    axisLock.current = null;
    dxRef.current = 0;
    setIsDragging(false);
    setDx(0);
  }

  function finish() {
    if (Math.abs(dxRef.current) > 72) onRemove();
    reset();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-ember/90 text-[11px] font-black text-white">
        Remove
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-ember/90 text-[11px] font-black text-white">
        Remove
      </div>
      <div
        className="relative touch-pan-y"
        style={{ transform: `translateX(${dx}px)`, transition: isDragging ? "none" : "transform 180ms ease" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if ((event.target as HTMLElement).closest("input, button, textarea, a, [role='combobox'], [role='checkbox']")) {
            return;
          }
          start.current = { x: event.clientX, y: event.clientY };
          dragging.current = true;
          axisLock.current = null;
          dxRef.current = 0;
          setIsDragging(true);
          setDx(0);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!start.current || !dragging.current) return;
          const nextX = event.clientX - start.current.x;
          const nextY = event.clientY - start.current.y;

          if (!axisLock.current) {
            if (Math.abs(nextX) < 8 && Math.abs(nextY) < 8) return;
            axisLock.current = Math.abs(nextX) >= Math.abs(nextY) ? "x" : "y";
            if (axisLock.current === "y") {
              dragging.current = false;
              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {
                /* already released */
              }
              reset();
              return;
            }
          }

          if (axisLock.current !== "x") return;

          event.preventDefault();
          const clamped = Math.max(-120, Math.min(120, nextX));
          dxRef.current = clamped;
          setDx(clamped);
        }}
        onPointerUp={finish}
        onPointerCancel={reset}
        onLostPointerCapture={() => {
          if (dragging.current) finish();
        }}
      >
        {children}
      </div>
      <span className="sr-only">Swipe {label} left or right to remove</span>
    </div>
  );
}
