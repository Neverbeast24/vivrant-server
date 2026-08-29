import type { Metadata } from "next";
import { TrainingHub } from "@/components/dashboard/training-hub";
import { loadGymData } from "@/app/dashboard/gym/data";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [gym, workoutsRes, checkinRes, profileRes] = await Promise.all([
    loadGymData(),
    supabase
      .from("workout_logs")
      .select("id, duration_minutes")
      .eq("user_id", user.id)
      .gte("logged_at", dayStart.toISOString()),
    supabase
      .from("daily_checkins")
      .select("steps")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("daily_step_goal")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const workouts = workoutsRes.data ?? [];
  const workoutMinutes = workouts.reduce((s, w) => s + Number(w.duration_minutes ?? 0), 0);

  return (
    <TrainingHub
      workoutsToday={workouts.length}
      workoutMinutes={workoutMinutes}
      steps={Number(checkinRes.data?.steps ?? 0)}
      stepGoal={Number(profileRes.data?.daily_step_goal ?? 8000)}
      sessionCount={gym.sessions.length}
      totalMinutes={gym.totalMinutes}
      totalCalories={gym.totalCalories}
      machineCount={gym.machineCount}
      demoCount={gym.demoCount}
      planCount={gym.plans.length}
      plans={gym.plans}
      exercises={gym.exercises}
      sessions={gym.sessions}
      bodyWeightKg={gym.scaling?.weight_kg ?? null}
    />
  );
}
