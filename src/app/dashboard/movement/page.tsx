import type { Metadata } from "next";
import { MovementView } from "@/components/dashboard/movement";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Movement" };

export default async function MovementPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [workoutsRes, checkinRes] = await Promise.all([
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
  ]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_step_goal")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <MovementView
      workouts={workoutsRes.data ?? []}
      steps={checkinRes.data?.steps ?? 0}
      stepGoal={profile?.daily_step_goal ?? 8000}
    />
  );
}
