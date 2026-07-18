"use client";

import { Flame, Footprints, Heart, Timer } from "lucide-react";
import { logWorkout } from "@/app/dashboard/movement/actions";
import { PageHeader, Panel, Stagger, StatCard } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Workout = {
  id: number;
  title: string;
  activity_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
};

export function MovementView({ workouts }: { workouts: Workout[] }) {
  const { pending, submit } = useModuleAction(logWorkout);
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="MOVEMENT" title="Move a little" highlight="today." />

      <Panel title="Log a workout" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="title" required placeholder="Workout title" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm sm:col-span-2" />
          <select name="activity_type" defaultValue="walk" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm">
            <option value="walk">Walk</option>
            <option value="run">Run</option>
            <option value="strength">Strength</option>
            <option value="cycle">Cycle</option>
            <option value="yoga">Yoga</option>
            <option value="other">Other</option>
          </select>
          <input name="duration_minutes" type="number" min={1} required placeholder="Minutes" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <input name="calories_burned" type="number" min={0} placeholder="Calories" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <button disabled={pending} className="rounded-2xl bg-[#24212e] px-4 py-3 text-sm font-bold text-white sm:col-span-2 lg:col-span-4">
            {pending ? "Saving…" : "Log workout"}
          </button>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            label="Steps"
            value="6,420"
            detail="78% of goal"
            icon={Footprints}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
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
            value="410"
            detail="Burned today"
            icon={Flame}
            className="bg-[#fff3e8] text-[#533621]"
          />
          <StatCard
            label="Avg heart"
            value="72"
            suffix="bpm"
            detail="Resting"
            icon={Heart}
            className="bg-[#fdeaf1] text-[#5a2438]"
          />
        </div>

        <Panel title="Sessions" className="mt-4">
          <div className="space-y-2">
            {workouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{workout.title}</p>
                  <p className="text-xs capitalize text-[#847f8c]">{workout.activity_type}</p>
                </div>
                <span className="text-xs font-black">{workout.duration_minutes ?? 0} min</span>
              </div>
            ))}
            {!workouts.length && <p className="text-sm text-[#9a95a0]">No workouts logged yet.</p>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
