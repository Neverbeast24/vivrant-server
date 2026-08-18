"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Repeat2, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { logProgramGymSession } from "@/app/dashboard/gym/actions";
import { EmptyState, Panel, PrimaryButton } from "@/components/dashboard/ui";
import {
  formatRestClock,
  gymSessionFocusFromPlan,
  humanizeGymLabel,
  parseRestSeconds,
  parseSetCount,
  pickTodaysPlanDay,
  type GymPlan,
  type GymPlanDay,
} from "@/lib/gym";

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
  itemKey: string;
  label: string;
  remaining: number;
  total: number;
};

function storageKey(planId: number, day: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `vivrant.gym.liveSession.${planId}.${day}.${date}`;
}

function buildItems(day: GymPlanDay): RunnerItem[] {
  const mains: RunnerItem[] = (day.exercises ?? []).map((ex, index) => ({
    key: `main-${index}`,
    name: ex.name,
    originalName: ex.name,
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
    name: addon.name,
    originalName: addon.name,
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

  const plan = plans.find((item) => item.id === planId) ?? plans[0] ?? null;
  const today = plan ? pickTodaysPlanDay(plan.days ?? []) : null;
  const items = useMemo(() => (today ? buildItems(today) : []), [today]);

  useEffect(() => {
    if (plans[0] && !plans.some((item) => item.id === planId)) {
      setPlanId(plans[0].id);
    }
  }, [planId, plans]);

  useEffect(() => {
    setHydrated(false);
    if (!plan || !today) {
      setChecks({});
      setNames({});
      setHydrated(true);
      return;
    }
    const nextItems = buildItems(today);
    const nextNames = Object.fromEntries(nextItems.map((item) => [item.key, item.name]));
    let nextChecks = emptyChecks(nextItems);
    let nextStarted: number | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey(plan.id, today.day));
      if (raw) {
        const saved = JSON.parse(raw) as {
          checks?: Record<string, boolean[]>;
          names?: Record<string, string>;
          startedAt?: number;
        };
        if (saved.checks) {
          nextChecks = Object.fromEntries(
            nextItems.map((item) => {
              const row = saved.checks?.[item.key];
              return [item.key, Array.from({ length: item.setCount }, (_, i) => Boolean(row?.[i]))];
            }),
          );
        }
        if (saved.names) {
          for (const item of nextItems) {
            if (saved.names[item.key]) nextNames[item.key] = saved.names[item.key];
          }
        }
        if (saved.startedAt) nextStarted = saved.startedAt;
      }
    } catch {
      // ignore corrupt live-session cache
    }
    setChecks(nextChecks);
    setNames(nextNames);
    setStartedAt(nextStarted);
    setHydrated(true);
  }, [plan, today]);

  useEffect(() => {
    if (!hydrated || !plan || !today || !Object.keys(checks).length) return;
    try {
      sessionStorage.setItem(
        storageKey(plan.id, today.day),
        JSON.stringify({ checks, names, startedAt }),
      );
    } catch {
      // ignore quota / private mode
    }
  }, [checks, hydrated, names, plan, startedAt, today]);

  useEffect(() => {
    if (!rest) return;
    const id = window.setInterval(() => {
      setRest((current) => {
        if (!current) return current;
        if (current.remaining <= 1) {
          toast.success("Rest done — next set.");
          return null;
        }
        return { ...current, remaining: current.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [rest?.itemKey, rest?.total]);

  const doneCount = items.reduce(
    (sum, item) => sum + (checks[item.key] ?? []).filter(Boolean).length,
    0,
  );
  const totalCount = items.reduce((sum, item) => sum + item.setCount, 0);
  const elapsedMinutes = startedAt
    ? Math.max(5, Math.round((Date.now() - startedAt) / 60_000))
    : 45;

  function markStarted() {
    setStartedAt((current) => current ?? Date.now());
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
      setRest({
        itemKey: item.key,
        label: names[item.key] ?? item.name,
        remaining: item.restSeconds,
        total: item.restSeconds,
      });
    }
  }

  function toggleExercise(item: RunnerItem) {
    const current = checks[item.key] ?? Array.from({ length: item.setCount }, () => false);
    const allOn = current.every(Boolean);
    const next = current.map(() => !allOn);
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    if (allOn) return;
    markStarted();
    if (item.restSeconds > 0) {
      setRest({
        itemKey: item.key,
        label: names[item.key] ?? item.name,
        remaining: item.restSeconds,
        total: item.restSeconds,
      });
    }
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
      try {
        sessionStorage.removeItem(storageKey(plan.id, today.day));
      } catch {
        // ignore
      }
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
        <EmptyState>This program does not have a session for today.</EmptyState>
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
          Check off each set. Rest starts automatically from the program (skip anytime). Save when you are
          done — this is the same log as Sessions.
        </p>
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
              <p className="font-display text-3xl leading-none">{formatRestClock(rest.remaining)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20 sm:w-24">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(4, (rest.remaining / Math.max(rest.total, 1)) * 100)}%` }}
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
                      <p className="text-sm font-black">{displayName}</p>
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
            <Timer size={16} /> {formatRestClock(rest.remaining)}
          </span>
          <button type="button" onClick={() => setRest(null)} className="text-[11px] font-black">
            Skip rest
          </button>
        </div>
      )}
    </>
  );
}
