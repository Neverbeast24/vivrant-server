import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HydrationView } from "@/components/dashboard/hydration";

export const metadata: Metadata = { title: "Hydration" };

export default async function HydrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);

  const [checkin, profile, week] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("water_ml")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("daily_water_goal_ml")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("checkin_date, water_ml")
      .eq("user_id", user.id)
      .gte("checkin_date", weekStart.toISOString().slice(0, 10))
      .order("checkin_date", { ascending: false }),
  ]);

  return (
    <HydrationView
      waterMl={Number(checkin.data?.water_ml ?? 0)}
      goalMl={Number(profile.data?.daily_water_goal_ml ?? 2400)}
      weekRows={week.data ?? []}
    />
  );
}
