import type { Metadata } from "next";
import { NutritionView } from "@/components/dashboard/nutrition";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [mealsRes, checkinRes] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", dayStart.toISOString())
      .order("logged_at", { ascending: false })
      .limit(20),
    supabase
      .from("daily_checkins")
      .select("water_ml")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
  ]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_water_goal_ml")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <NutritionView
      meals={mealsRes.data ?? []}
      waterMl={checkinRes.data?.water_ml ?? 0}
      waterGoalMl={profile?.daily_water_goal_ml ?? 2400}
    />
  );
}
