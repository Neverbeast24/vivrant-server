"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Pencil, Plus, Sparkles, Target, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import {
  addHabit,
  createChallenge,
  deleteChallenge,
  deleteHabit,
  refreshChallenges,
  suggestHabits,
  toggleHabitToday,
  updateHabit,
} from "@/app/dashboard/habits/actions";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import {
  EmptyState,
  FormField,
  ModuleJumpLinks,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { DragGrip, ItemDragRow } from "@/components/dashboard/drag-list";
import { useSavedListOrder } from "@/components/dashboard/use-saved-list-order";

const habitsSubNav = [
  { href: "/dashboard/habits", label: "Overview" },
  { href: "/dashboard/habits/add", label: "Add" },
  { href: "/dashboard/habits/challenges", label: "Challenges" },
] as const;

type Habit = {
  id: number;
  title: string;
  category: string;
  frequency: string;
  doneToday: boolean;
  streak: number;
};

type ChallengeRow = {
  id: number;
  title: string;
  description: string | null;
  metric: string;
  target_value: number;
  starts_on: string;
  ends_on: string;
  current_value: number;
  completed: boolean;
};

export function HabitsView({
  habits,
  bestStreak,
  section = "overview",
  challenges = [],
  listOrder = [],
}: {
  habits: Habit[];
  bestStreak: number;
  section?: "overview" | "challenges" | "add";
  challenges?: ChallengeRow[];
  listOrder?: number[];
}) {
  const { pending, submit } = useModuleAction(addHabit);
  const challengeAction = useModuleAction(createChallenge);
  const [suggestPending, startSuggest] = useTransition();
  const [ideas, setIdeas] = useState<{ title: string; category: string; reason: string }[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingEdit, startSaveEdit] = useTransition();
  const { items: orderedHabits, move } = useSavedListOrder("habits", habits, listOrder);
  const doneCount = orderedHabits.filter((h) => h.doneToday).length;

  return (
    <>
      <PageHeader
        eyebrow="HABITS"
        title={
          section === "challenges" ? "Weekly" : section === "add" ? "Add a" : "Streaks that"
        }
        highlight={
          section === "challenges" ? "challenges." : section === "add" ? "habit." : "stick."
        }
        action={
          section === "challenges" ? (
            <PrimaryButton
              className="rounded-full"
              onClick={async () => {
                const result = await refreshChallenges();
                if (result.ok) toast.success(result.message);
                else toast.error(result.message);
              }}
            >
              Sync progress
            </PrimaryButton>
          ) : section === "add" ? (
            <PrimaryButton
              disabled={suggestPending}
              className="rounded-full"
              onClick={() =>
                startSuggest(async () => {
                  const result = await suggestHabits();
                  if (!result.ok || !("habits" in result) || !result.habits) {
                    toast.error(result.message);
                    return;
                  }
                  setIdeas(result.habits);
                  toast.success(result.message);
                })
              }
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              {suggestPending ? "Thinking…" : "AI habit ideas"}
            </PrimaryButton>
          ) : undefined
        }
      />
      <ModuleSubNav items={habitsSubNav} />
      <ModuleJumpLinks
        items={
          section === "overview"
            ? [
                { href: "/dashboard/habits/add", title: "Add a habit", icon: Plus },
                { href: "/dashboard/habits/challenges", title: "Weekly challenges", icon: Trophy },
              ]
            : section === "add"
              ? [
                  { href: "/dashboard/habits", title: "Today’s habits", icon: Check },
                  { href: "/dashboard/habits/challenges", title: "Weekly challenges", icon: Trophy },
                ]
              : [
                  { href: "/dashboard/habits", title: "Today’s habits", icon: Check },
                  { href: "/dashboard/habits/add", title: "Add a habit", icon: Plus },
                ]
        }
      />

      {section === "overview" && (
        <>
          <Stagger>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Done today"
                value={`${doneCount}/${orderedHabits.length || 0}`}
                detail="Daily checkboxes"
                icon={Check}
                tone="ink"
              />
              <StatCard
                label="Best streak"
                value={String(bestStreak)}
                suffix="days"
                detail="Keep the chain alive"
                icon={Flame}
              />
              <StatCard
                label="Active habits"
                value={String(orderedHabits.length)}
                detail="Small and steady"
                icon={Target}
              />
            </div>
          </Stagger>

          <Panel title="Today" className="mb-8">
              <p className="mb-2 text-[11px] font-bold leading-4 text-muted">
                Drag the grips to reorder habits.
              </p>
              <div className="space-y-2">
                {orderedHabits.map((habit, index) => (
                  <ItemDragRow
                    key={habit.id}
                    index={index}
                    onMove={move}
                    className="flex items-center gap-3 rounded-2xl border border-ink/8 px-3 py-3"
                  >
                    <DragGrip label={`Reorder ${habit.title}`} />
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await toggleHabitToday(habit.id, !habit.doneToday);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      }}
                      className={`grid size-9 place-items-center rounded-xl border ${
                        habit.doneToday
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-ink/15 text-muted"
                      }`}
                    >
                      <Check size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      {editingId === habit.id ? (
                        <form
                          className="grid gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            formData.set("id", String(habit.id));
                            startSaveEdit(async () => {
                              const result = await updateHabit(formData);
                              if (result.ok) {
                                toast.success(result.message);
                                setEditingId(null);
                              } else toast.error(result.message);
                            });
                          }}
                        >
                          <input name="title" defaultValue={habit.title} required className={fieldClass} />
                          <select name="category" defaultValue={habit.category} className={fieldClass}>
                            {["nutrition", "movement", "sleep", "mindfulness", "hydration", "other"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <PrimaryButton disabled={savingEdit} className="rounded-full px-4">{savingEdit ? "Saving…" : "Save"}</PrimaryButton>
                            <button type="button" onClick={() => setEditingId(null)} className="text-xs font-black text-muted">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                      <p className="truncate text-sm font-bold">{habit.title}</p>
                      <p className="text-xs text-muted">
                        {habit.category} · {habit.streak} day streak
                      </p>
                        </>
                      )}
                    </div>
                    {editingId !== habit.id && (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted hover:bg-ink/5"
                      onClick={() => setEditingId(habit.id)}
                      aria-label={`Edit ${habit.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    )}
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted hover:bg-ink/5"
                      onClick={async () => {
                        if (!(await confirmDelete(habit.title))) return;
                        const result = await deleteHabit(habit.id);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </ItemDragRow>
                ))}
                {!orderedHabits.length && (
                  <EmptyState>
                    Add your first habit on the{" "}
                    <span className="font-black">Add</span> page — try “Drink water” or “Stretch 5 minutes”.
                  </EmptyState>
                )}
              </div>
            </Panel>
        </>
      )}

      {section === "add" && (
        <Panel title="New habit">
          <form action={submit} className="grid max-w-xl gap-4">
            <FormField label="Title">
              <input name="title" required placeholder="Stretch 5 minutes" className={fieldClass} />
            </FormField>
            <FormField label="Category">
              <select name="category" className={fieldClass} defaultValue="other">
                {["nutrition", "movement", "sleep", "mindfulness", "hydration", "other"].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </FormField>
            <PrimaryButton disabled={pending}>{pending ? "Adding…" : "Add habit"}</PrimaryButton>
          </form>
          {ideas.length > 0 && (
            <ul className="mt-6 space-y-3">
              {ideas.map((idea) => (
                <li key={idea.title} className="rounded-2xl border border-ink/8 p-4 text-sm">
                  <p className="font-bold">{idea.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {idea.category} · {idea.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {section === "challenges" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <Panel title="Create weekly challenge">
            <form action={challengeAction.submit} className="grid gap-3">
              <FormField label="Title">
                <input name="title" required placeholder="3 gym sessions" className={fieldClass} />
              </FormField>
              <FormField label="Metric">
                <select name="metric" className={fieldClass} defaultValue="habits">
                  {["habits", "workouts", "gym", "water", "sleep", "checkins"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Target">
                <input name="target_value" type="number" min={1} required defaultValue={3} className={fieldClass} />
              </FormField>
              <FormField label="Description" hint="optional">
                <textarea name="description" rows={2} className={fieldClass} />
              </FormField>
              <PrimaryButton disabled={challengeAction.pending}>
                {challengeAction.pending ? "Creating…" : "Start challenge"}
              </PrimaryButton>
            </form>
          </Panel>

          <Panel title="Active challenges">
            <ul className="space-y-3">
              {challenges.map((c) => {
                const pct = Math.min(
                  100,
                  Math.round((Number(c.current_value) / Math.max(Number(c.target_value), 1)) * 100),
                );
                return (
                  <li key={c.id} className="rounded-2xl border border-ink/8 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-black">
                          <Trophy size={14} className="text-accent" />
                          {c.title}
                          {c.completed ? " · Done" : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {c.metric} · {c.starts_on} → {c.ends_on}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-ink/5"
                        onClick={async () => {
                          if (!(await confirmDelete(c.title))) return;
                          const result = await deleteChallenge(c.id);
                          if (result.ok) toast.success(result.message);
                          else toast.error(result.message);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3">
                      <Progress value={pct} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-muted">
                      {Number(c.current_value).toFixed(0)} / {Number(c.target_value)}
                    </p>
                  </li>
                );
              })}
              {!challenges.length && (
                <EmptyState>
                  No challenges yet. Example: metric <span className="font-black">gym</span>, target{" "}
                  <span className="font-black">3</span> this week — then Sync progress as you log.
                </EmptyState>
              )}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
