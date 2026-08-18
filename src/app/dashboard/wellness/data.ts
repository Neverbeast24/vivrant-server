import { requireUser } from "@/lib/auth/roles";
import type { WellnessPulse } from "@/app/dashboard/wellness/types";

export type { WellnessPulse };

export async function loadWellnessPulse(): Promise<WellnessPulse> {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);

  const [checkinRes, profileRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("sleep_minutes, water_ml, mood")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("daily_water_goal_ml")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    sleepMinutes:
      checkinRes.data?.sleep_minutes != null ? Number(checkinRes.data.sleep_minutes) : null,
    waterMl: Number(checkinRes.data?.water_ml ?? 0),
    waterGoalMl: Number(profileRes.data?.daily_water_goal_ml ?? 2400),
    mood: checkinRes.data?.mood != null ? Number(checkinRes.data.mood) : null,
  };
}
