"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Pause, Sparkles, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addHealthGoal,
  deleteHealthGoal,
  updateGoalStatus,
} from "@/app/dashboard/goals/actions";
import { acceptSuggestedGoal, suggestGoalsWithAi } from "@/app/dashboard/goals/ai-actions";
import {
  EmptyState,
  FormField,
  Panel,
  PrimaryButton,
  Progress,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

export type HealthGoal = {
  id: number;
  title: string;
  category: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  target_date: string | null;
  status: "active" | "completed" | "paused";
};

type SuggestedGoal = {
  title: string;
  category: string;
  target_value: number | null;
  unit: string | null;
  why: string;
};

export function GoalsPanel({ goals }: { goals: HealthGoal[] }) {
  const { pending, submit } = useModuleAction(addHealthGoal);
  const [busy, start] = useTransition();
  const [suggesting, startSuggest] = useTransition();
  const [ideas, setIdeas] = useState<SuggestedGoal[]>([]);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function suggest() {
    startSuggest(async () => {
      const result = await suggestGoalsWithAi();
      if (!result.ok || !("goals" in result) || !result.goals) {
        toast.error(result.message);
        return;
      }
      setIdeas(result.goals);
      toast.success(result.message);
    });
  }

  return (
    <Panel
      title="Health goals"
      className="mt-4"
      right={
        <button
          type="button"
          disabled={suggesting}
          onClick={suggest}
          className="inline-flex items-center gap-1 text-xs font-black text-[#5f45e6] transition hover:opacity-70"
        >
          <Sparkles size={13} />
          {suggesting ? "Suggesting…" : "AI suggest"}
        </button>
      }
    >
      {ideas.length > 0 && (
        <div className="mb-5 space-y-2 rounded-2xl border border-[#5f45e6]/15 bg-[#ece7fb]/50 p-3">
          {ideas.map((idea) => (
            <div
              key={idea.title}
              className="flex flex-col gap-2 rounded-xl bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-black">{idea.title}</p>
                <p className="mt-1 text-xs text-[#847f8c]">
                  {idea.category}
                  {idea.target_value != null
                    ? ` · ${idea.target_value}${idea.unit ? ` ${idea.unit}` : ""}`
                    : ""}
                  {" — "}
                  {idea.why}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const result = await acceptSuggestedGoal(idea);
                    if (result.ok) {
                      setIdeas((prev) => prev.filter((row) => row.title !== idea.title));
                    }
                    return result;
                  })
                }
                className="rounded-full bg-[#26222f] px-3 py-1.5 text-[11px] font-black text-white"
              >
                Add goal
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={submit} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FormField label="Goal" hint="Required" className="sm:col-span-2">
          <input name="title" required placeholder="e.g. Walk 8,000 steps daily" className={fieldClass} />
        </FormField>
        <FormField label="Category">
          <select name="category" defaultValue="movement" className={fieldClass}>
            <option value="nutrition">Nutrition</option>
            <option value="movement">Movement</option>
            <option value="sleep">Sleep</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="spending">Spending</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        <FormField label="Target">
          <input name="target_value" type="number" min={0} step="0.1" placeholder="8000" className={fieldClass} />
        </FormField>
        <FormField label="Unit">
          <input name="unit" placeholder="steps" className={fieldClass} />
        </FormField>
        <FormField label="Target date" className="sm:col-span-2 lg:col-span-2">
          <input name="target_date" type="date" className={fieldClass} />
        </FormField>
        <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-3">
          {pending ? "Saving…" : "Add goal"}
        </PrimaryButton>
      </form>

      <div className="space-y-3">
        {goals.map((goal) => {
          const progress =
            goal.target_value && goal.target_value > 0
              ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100))
              : goal.status === "completed"
                ? 100
                : 0;
          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/40 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ece7fb] text-[#5f45e6]">
                  <Target size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black">{goal.title}</p>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#8a8491]">
                      {goal.category}
                    </span>
                    <span className="rounded-full bg-[#ece7fb] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#5f45e6]">
                      {goal.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#847f8c]">
                    {goal.target_value != null
                      ? `${goal.current_value}/${goal.target_value}${goal.unit ? ` ${goal.unit}` : ""}`
                      : "No numeric target"}
                    {goal.target_date ? ` · due ${goal.target_date}` : ""}
                  </p>
                  <div className="mt-3">
                    <Progress value={progress} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {goal.status !== "completed" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => updateGoalStatus(goal.id, "completed"))}
                      className="grid size-8 place-items-center rounded-lg text-[#0f8f80] transition hover:bg-[#e6faf6]"
                      title="Mark completed"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  {goal.status === "active" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => updateGoalStatus(goal.id, "paused"))}
                      className="grid size-8 place-items-center rounded-lg text-[#8a8491] transition hover:bg-white"
                      title="Pause goal"
                    >
                      <Pause size={15} />
                    </button>
                  )}
                  {goal.status === "paused" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => updateGoalStatus(goal.id, "active"))}
                      className="grid size-8 place-items-center rounded-lg text-[#5f45e6] transition hover:bg-[#ece7fb]"
                      title="Resume goal"
                    >
                      <Target size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => deleteHealthGoal(goal.id))}
                    className="grid size-8 place-items-center rounded-lg text-[#a9a4b0] transition hover:bg-[#fff0e8] hover:text-[#e4571f]"
                    title="Delete goal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!goals.length && <EmptyState>No goals yet. Add one above to track progress.</EmptyState>}
      </div>
    </Panel>
  );
}
