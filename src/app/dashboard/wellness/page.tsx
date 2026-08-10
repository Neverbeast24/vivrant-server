import type { Metadata } from "next";
import { WellnessHub } from "@/components/dashboard/wellness-hub";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Wellness" };

export default async function WellnessPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const [checkinRes, profileRes, sleepRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("water_ml, mood")
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
      .select("checkin_date, sleep_minutes")
      .eq("user_id", user.id)
      .gte("checkin_date", start.toISOString().slice(0, 10))
      .order("checkin_date", { ascending: false })
      .limit(8),
  ]);

  const sleepRows = sleepRes.data ?? [];
  const lastSleep =
    sleepRows.find((r) => r.checkin_date === today)?.sleep_minutes ??
    sleepRows.find((r) => r.sleep_minutes != null)?.sleep_minutes ??
    null;

  return (
    <WellnessHub
      lastSleepMinutes={lastSleep != null ? Number(lastSleep) : null}
      waterMl={Number(checkinRes.data?.water_ml ?? 0)}
      waterGoalMl={Number(profileRes.data?.daily_water_goal_ml ?? 2400)}
      todayMood={checkinRes.data?.mood != null ? Number(checkinRes.data.mood) : null}
    />
  );
}
