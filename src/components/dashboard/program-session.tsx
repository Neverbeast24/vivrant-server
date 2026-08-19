"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Repeat2, Timer, X } from "lucide-react";
import { toast } from "sonner";
import {
  clearGymLiveSessionAction,
  loadGymLiveSessionAction,
  logProgramGymSession,
  saveGymLiveSessionAction,
} from "@/app/dashboard/gym/actions";
import { EmptyState, Panel, PrimaryButton } from "@/components/dashboard/ui";
import {
  formatRestClock,
  formatGymMoveName,
  gymSessionFocusFromPlan,
  humanizeGymLabel,
  parseRestSeconds,
  parseSetCount,
  pickTodaysPlanDay,
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
  type GymLiveSessionDraft,
} from "@/lib/gym-live-session";
import { playGymRestAlarm, requestGymRestNotifyPermission, unlockGymRestAlert } from "@/lib/gym-rest-alert";

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

function emptyChecks(items: RunnerItem[]) {
  return Object.fromEntries(items.map((item) => [item.key, Array.from({ length: item.setCount }, () => false)]));
}

export function ProgramSessionPanel({
  plans,
  compact = false,
}: {
  plans: GymPlan[];
  compact?: boolean;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [rest, setRest] = useState<RestState | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, startSave] = useTransition();
  const [restored, setRestored] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const syncTimer = useRef<number | null>(null);

  const plan = plans.find((item) => item.id === planId) ?? plans[0] ?? null;
  const today = plan ? pickTodaysPlanDay(plan.days ?? [], new Date(), plan.training_days) : null;
  const items = useMemo(() => (today ? buildItems(today) : []), [today]);

  useEffect(() => {
    let cancelled = false;
    if (!plan || !today) {
      queueMicrotask(() => {
        if (cancelled) return;
        setChecks({});
        setNames({});
        setRest(null);
        setRestored(false);
        setHydrated(true);
      });
      return () => {
        cancelled = true;
      };
    }
    const nextItems = buildItems(today);
    const nextNames = Object.fromEntries(nextItems.map((item) => [item.key, item.name]));
    const applyDraft = (saved: GymLiveSessionDraft | null) => {
      if (cancelled) return;
      let nextChecks = emptyChecks(nextItems);
      const namesOut = { ...nextNames };
      if (saved && liveSessionMatches(saved, plan.id, today.day)) {
        nextChecks = Object.fromEntries(
          nextItems.map((item) => {
            const row = saved.checks[item.key];
            return [item.key, Array.from({ length: item.setCount }, (_, i) => Boolean(row?.[i]))];
          }),
        );
        for (const item of nextItems) {
          if (saved.names[item.key]) namesOut[item.key] = saved.names[item.key];
        }
        setStartedAt(saved.started_at);
        const remaining = restRemainingSeconds(saved.rest_ends_at);
        if (remaining > 0 && saved.rest_ends_at) {
          setRest({
            label: saved.rest_label ?? "Rest",
            total: saved.rest_total ?? remaining,
            endsAt: saved.rest_ends_at,
            alerted: Boolean(saved.rest_alerted),
          });
        } else if (saved.rest_ends_at && remaining <= 0 && !saved.rest_alerted) {
          setRest(null);
          void playGymRestAlarm(saved.rest_label ?? undefined);
          toast.success("Rest done — next set.");
        } else {
          setRest(null);
        }
        setRestored(liveSessionHasProgress(saved));
      } else {
        setStartedAt(null);
        setRest(null);
        setRestored(false);
      }
      setChecks(nextChecks);
      setNames(namesOut);
      setHydrated(true);
    };

    const local = readLocalLiveSession();
    queueMicrotask(() => {
      if (cancelled) return;
      applyDraft(liveSessionMatches(local, plan.id, today.day) ? local : null);
    });

    void (async () => {
      try {
        const remote = await loadGymLiveSessionAction();
        if (cancelled || !remote.ok) return;
        const merged = newerLiveSession(
          liveSessionMatches(local, plan.id, today.day) ? local : null,
          remote.session,
        );
        if (merged && liveSessionMatches(merged, plan.id, today.day)) {
          applyDraft(merged);
        }
      } catch {
        // offline — local draft is enough
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan, today]);

  useEffect(() => {
    if (!hydrated || !plan || !today || !Object.keys(checks).length) return;
    const draft: GymLiveSessionDraft = {
      plan_id: plan.id,
      day_label: today.day,
      session_date: todaySessionDate(),
      checks,
      names,
      started_at: startedAt,
      rest_ends_at: rest?.endsAt ?? null,
      rest_label: rest?.label ?? null,
      rest_total: rest?.total ?? null,
      rest_alerted: rest?.alerted ?? false,
      updated_at: new Date().toISOString(),
    };
    writeLocalLiveSession(draft);
    if (!liveSessionHasProgress(draft) && !draft.rest_ends_at) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      void saveGymLiveSessionAction(draft);
    }, 600);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [checks, hydrated, names, plan, rest, startedAt, today]);

  useEffect(() => {
    if (!rest) return;
    const tick = () => {
      const remaining = restRemainingSeconds(rest.endsAt);
      setNowTick(Date.now());
      if (remaining <= 0 && !rest.alerted) {
        void playGymRestAlarm(rest.label);
        toast.success("Rest done — next set.");
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
  }, [rest]);

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

  function startRest(label: string, seconds: number) {
    if (seconds <= 0) return;
    unlockGymRestAlert();
    requestGymRestNotifyPermission();
    const endsAt = restEndsAtFromSeconds(seconds);
    setRest({
      label,
      total: seconds,
      endsAt,
      alerted: false,
    });
  }

  function toggleSet(item: RunnerItem, index: number) {
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    const nextValue = !current[index];
    const next = current.map((value, i) => (i === index ? nextValue : value));
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    if (!nextValue) return;
    markStarted();
    const remainingSets = items.some((row) => {
      const rowChecks = row.key === item.key ? next : checks[row.key] ?? [];
      return rowChecks.some((value) => !value);
    });
    if (item.restSeconds > 0 && remainingSets) {
      startRest(names[item.key] ?? item.name, item.restSeconds);
    }
  }

  function toggleExercise(item: RunnerItem) {
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    const allOn = current.every(Boolean);
    const next = current.map(() => !allOn);
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    if (allOn) return;
    markStarted();
    startRest(names[item.key] ?? item.name, item.restSeconds);
  }

  function swapItem(item: RunnerItem) {
    if (!item.swap) return;
    setNames((prev) => {
      const current = prev[item.key] ?? item.name;
      const next = current === item.originalName ? item.swap! : item.originalName;
      return { ...prev, [item.key]: next };
    });
  }

  function save() {
    if (!plan || !today) return;
    const logged = items
      .map((item) => {
        const row = checks[item.key] ?? [];
        const completed = row.filter(Boolean).length;
        if (!completed) return null;
        return {
          name: names[item.key] ?? item.name,
          sets: item.setsLabel,
          rest: item.rest,
          ...(item.weight ? { weight: item.weight } : {}),
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
        title: `${today.day}: ${humanizeGymLabel(today.focus)}`,
        focus: gymSessionFocusFromPlan(today.focus),
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

  if (!plan || !today) {
    return (
      <Panel title="Today’s program" className={compact ? "mb-4" : ""}>
        <EmptyState>
          Rest day — no gym session on your schedule today. Enjoy recovery, or log a walk below.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title="Today’s program"
        className={compact ? "mb-4" : ""}
        right={
          <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-black text-accent">
            {doneCount}/{totalCount} sets
          </span>
        }
      >
        <p className="mb-3 text-sm leading-6 text-muted">
          Check off each set. Rest starts automatically from the program (skip anytime). Close the tab
          anytime — your sets and rest timer come back. Save when you are done.
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
              onChange={(event) => setPlanId(Number(event.target.value))}
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
        <div className="mb-3 rounded-2xl border border-accent/15 bg-accent-soft/50 px-3.5 py-3">
          <p className="text-[11px] font-black text-accent">
            {today.day} · {humanizeGymLabel(today.focus)}
          </p>
          <p className="mt-0.5 text-sm font-black">{plan.title}</p>
        </div>

        {rest && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-inverse px-4 py-3 text-inverse-fg">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-inverse-fg/70">
                Rest · {rest.label}
              </p>
              <p className="font-display text-3xl leading-none">{formatRestClock(restRemaining)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20 sm:w-24">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(4, (restRemaining / Math.max(rest.total, 1)) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setRest(null)}
                className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black"
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
            return (
              <article
                key={item.key}
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
                        ? "border-accent bg-accent text-inverse-fg"
                        : "border-ink/20 bg-card text-transparent hover:border-accent/50"
                    }`}
                    aria-label={`Mark ${displayName} complete`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-black">{formatGymMoveName(displayName)}</p>
                      {item.kind === "addon" && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-black text-muted">
                          Extra
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {[item.setsLabel, item.weight, item.restSeconds ? `rest ${item.rest}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.notes && <p className="mt-1 text-[11px] leading-4 text-muted">{item.notes}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.map((on, index) => (
                        <button
                          key={`${item.key}-set-${index}`}
                          type="button"
                          onClick={() => toggleSet(item, index)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition ${
                            on
                              ? "border-accent/40 bg-accent text-inverse-fg"
                              : "border-ink/10 bg-card text-muted hover:border-accent/30 hover:text-ink"
                          }`}
                        >
                          Set {index + 1}
                        </button>
                      ))}
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
            );
          })}
        </div>

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
          <button type="button" onClick={() => setRest(null)} className="text-[11px] font-black">
            Skip rest
          </button>
        </div>
      )}
    </>
  );
}
