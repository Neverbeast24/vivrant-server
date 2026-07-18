"use client";

import { useState, useTransition } from "react";
import { Flame, Footprints, Heart, Sparkles, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkout, logWorkout } from "@/app/dashboard/movement/actions";
import { suggestWorkoutWithAi } from "@/app/dashboard/movement/ai-actions";
import {
  EmptyState,
  FormField,
  ListRow,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Workout = {
  id: number;
  title: string;
  activity_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
};

export function MovementView({
  workouts,
  steps = 0,
  stepGoal = 8000,
}: {
  workouts: Workout[];
  steps?: number;
  stepGoal?: number;
}) {
  const { pending, submit } = useModuleAction(logWorkout);
  const [deleting, startDelete] = useTransition();
  const [suggesting, startSuggest] = useTransition();
  const [title, setTitle] = useState("");
  const [activity, setActivity] = useState("walk");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [reason, setReason] = useState<string | null>(null);

  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0);
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const effortIndex = Math.min(
    100,
    Math.round(totalMinutes * 1.8 + workouts.length * 8 + Math.min(steps, stepGoal) / 80),
  );

  function suggest() {
    startSuggest(async () => {
      const result = await suggestWorkoutWithAi();
      if (!result.ok || !("suggestion" in result) || !result.suggestion) {
        toast.error(result.message);
        return;
      }
      const s = result.suggestion;
      setTitle(s.title);
      setActivity(s.activity_type);
      setDuration(String(s.duration_minutes));
      setCalories(String(s.calories_burned));
      setReason(s.reason);
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="MOVEMENT"
        title="Move a little"
        highlight="today."
        action={
          <PrimaryButton disabled={suggesting} onClick={suggest} className="rounded-full px-5">
            <Sparkles size={14} className="mr-1.5" />
            {suggesting ? "Planning…" : "Suggest workout"}
          </PrimaryButton>
        }
      />

      {reason && (
        <p className="mb-4 rounded-2xl border border-[#5f45e6]/15 bg-[#ece7fb]/70 px-4 py-3 text-sm font-semibold text-[#5f45e6]">
          {reason}
        </p>
      )}

      <Panel title="Log a workout" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Workout" hint="Required" className="sm:col-span-2">
            <input
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Morning walk"
              className={fieldClass}
            />
          </FormField>
          <FormField label="Activity">
            <select
              name="activity_type"
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              className={fieldClass}
            >
              <option value="walk">Walk</option>
              <option value="run">Run</option>
              <option value="strength">Strength</option>
              <option value="cycle">Cycle</option>
              <option value="yoga">Yoga</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Duration" hint="minutes">
            <input
              name="duration_minutes"
              type="number"
              min={1}
              required
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="30"
              className={fieldClass}
            />
          </FormField>
          <FormField label="Energy burned" hint="kcal">
            <input
              name="calories_burned"
              type="number"
              min={0}
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </FormField>
          <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-4">
            {pending ? "Saving…" : "Log workout"}
          </PrimaryButton>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            label="Steps"
            value={steps.toLocaleString()}
            detail={`${stepPct}% of ${stepGoal.toLocaleString()} goal`}
            icon={Footprints}
            className="bg-gradient-to-br from-[#5f45e6] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Active min"
            value={String(totalMinutes)}
            detail={`${workouts.length} sessions`}
            icon={Timer}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Calories"
            value={String(totalCalories)}
            detail="Burned from logged workouts"
            icon={Flame}
            className="bg-[#fff3e8] text-[#533621]"
          />
          <StatCard
            label="Effort"
            value={String(effortIndex)}
            suffix="/100"
            detail={workouts.length || steps ? "From today’s activity" : "Log movement to score"}
            icon={Heart}
            className="bg-[#fdeaf1] text-[#5a2438]"
          />
        </div>

        <Panel title="Sessions" className="mt-4">
          <div className="space-y-2">
            {workouts.map((workout) => (
              <ListRow
                key={workout.id}
                title={workout.title}
                meta={workout.activity_type}
                right={
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-black">{workout.duration_minutes ?? 0} min</span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() =>
                        startDelete(async () => {
                          const result = await deleteWorkout(workout.id);
                          if (result.ok) toast.success(result.message);
                          else toast.error(result.message);
                        })
                      }
                      className="grid size-8 place-items-center rounded-lg text-[#a9a4b0] transition hover:bg-[#fff0e8] hover:text-[#e4571f]"
                      aria-label={`Delete ${workout.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                }
              />
            ))}
            {!workouts.length && <EmptyState>No workouts logged yet.</EmptyState>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
