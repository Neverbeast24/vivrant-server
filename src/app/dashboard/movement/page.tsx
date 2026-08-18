import type { Metadata } from "next";
import { MovementView } from "@/components/dashboard/movement";
import { requireUser } from "@/lib/auth/roles";
import { hydrateGymPlan, type GymPlan } from "@/lib/gym";

export const metadata: Metadata = { title: "Movement" };

export default async function MovementPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [workoutsRes, checkinRes, plansRes] = await Promise.all([
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
      .from("gym_plans")
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_step_goal")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <MovementView
      mode="overview"
      workouts={workoutsRes.data ?? []}
      steps={checkinRes.data?.steps ?? 0}
      stepGoal={profile?.daily_step_goal ?? 8000}
      plans={((plansRes.data ?? []) as GymPlan[]).map((row) => hydrateGymPlan(row))}
    />
  );
}
