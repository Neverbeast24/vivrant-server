import type { Metadata } from "next";
import { MovementView } from "@/components/dashboard/movement";
import { loadGymData } from "@/app/dashboard/gym/data";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Log Workout" };

type MovementLogPageProps = {
  searchParams: Promise<{ plan?: string; day?: string }>;
};

export default async function MovementLogPage({ searchParams }: MovementLogPageProps) {
  const { supabase, user } = await requireUser();
  const query = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [workoutsRes, checkinRes, profile, gym] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", dayStart.toISOString())
      .order("logged_at", { ascending: false })
      .limit(20),
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
    loadGymData(),
  ]);

  return (
    <MovementView
      mode="log"
      workouts={workoutsRes.data ?? []}
      steps={checkinRes.data?.steps ?? 0}
      stepGoal={profile.data?.daily_step_goal ?? 8000}
      plans={gym.plans}
      exercises={gym.exercises}
      initialPlanId={Number(query.plan) || undefined}
      initialDayLabel={query.day?.trim() || undefined}
      bodyWeightKg={gym.scaling?.weight_kg ?? null}
    />
  );
}
