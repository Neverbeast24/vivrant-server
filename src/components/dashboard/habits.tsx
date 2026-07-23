"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Sparkles, Target, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import {
  addHabit,
  createChallenge,
  deleteChallenge,
  deleteHabit,
  refreshChallenges,
  suggestHabits,
  toggleHabitToday,
} from "@/app/dashboard/habits/actions";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

const habitsSubNav = [
  { href: "/dashboard/habits", label: "Overview" },
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
}: {
  habits: Habit[];
  bestStreak: number;
  section?: "overview" | "challenges";
  challenges?: ChallengeRow[];
}) {
  const { pending, submit } = useModuleAction(addHabit);
  const challengeAction = useModuleAction(createChallenge);
  const [suggestPending, startSuggest] = useTransition();
  const [ideas, setIdeas] = useState<{ title: string; category: string; reason: string }[]>([]);
  const doneCount = habits.filter((h) => h.doneToday).length;

  return (
    <>
      <PageHeader
        eyebrow="HABITS"
        title={section === "challenges" ? "Weekly" : "Streaks that"}
        highlight={section === "challenges" ? "challenges." : "stick."}
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
          ) : (
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
          )
        }
      />
      <ModuleSubNav items={habitsSubNav} />

      {section === "overview" && (
        <>
          <Stagger>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Done today"
                value={`${doneCount}/${habits.length || 0}`}
                detail="Daily checkboxes"
                icon={Check}
                className="bg-inverse text-inverse-fg"
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
                value={String(habits.length)}
                detail="Small and steady"
                icon={Target}
              />
            </div>
          </Stagger>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Today">
              <ul className="space-y-2">
                {habits.map((habit) => (
                  <li
                    key={habit.id}
                    className="flex items-center gap-3 rounded-2xl border border-ink/8 px-3 py-3"
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await toggleHabitToday(habit.id, !habit.doneToday);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      }}
                      className={`grid size-9 place-items-center rounded-xl border ${
                        habit.doneToday
                          ? "border-accent bg-accent text-white"
                          : "border-ink/15 text-muted"
                      }`}
                    >
                      <Check size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{habit.title}</p>
                      <p className="text-xs text-muted">
                        {habit.category} · {habit.streak} day streak
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted hover:bg-ink/5"
                      onClick={async () => {
                        const result = await deleteHabit(habit.id);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
                {!habits.length && <EmptyState>Add your first habit.</EmptyState>}
              </ul>
            </Panel>

            <Panel title="Add habit">
              <form action={submit} className="grid gap-3">
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
                <ul className="mt-4 space-y-2">
                  {ideas.map((idea) => (
                    <li key={idea.title} className="rounded-xl border border-ink/8 p-3 text-sm">
                      <p className="font-bold">{idea.title}</p>
                      <p className="text-xs text-muted">
                        {idea.category} · {idea.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      {section === "challenges" && (
        <div className="grid gap-6 lg:grid-cols-2">
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
              {!challenges.length && <EmptyState>No challenges yet this week.</EmptyState>}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
