import type { Metadata } from "next";
import { TodayView, type TodayData } from "@/components/dashboard/today";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Today",
};

function startOfDayIso(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function weekLabels() {
  return ["M", "T", "W", "T", "F", "S", "S"] as const;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);
  const dayStart = startOfDayIso();

  const [checkinRes, weekRes, expensesRes, mealsRes, workoutsRes, profileRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("energy, mood, steps, water_ml, sleep_minutes")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("checkin_date, energy")
      .eq("user_id", user.id)
      .gte("checkin_date", weekStart)
      .lte("checkin_date", today),
    supabase
      .from("expenses")
      .select("amount, spent_at")
      .eq("user_id", user.id)
      .gte("spent_at", dayStart),
    supabase
      .from("nutrition_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("logged_at", dayStart),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("logged_at", dayStart),
    supabase
      .from("profiles")
      .select("daily_step_goal, daily_water_goal_ml, health_focus")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const energyByDate = new Map(
    (weekRes.data ?? []).map((row) => [row.checkin_date as string, Number(row.energy ?? 0)]),
  );

  const weekEnergy: TodayData["weekEnergy"] = weekLabels().map((label, index) => {
    const date = new Date();
    const dayOffset = index - (date.getDay() === 0 ? 6 : date.getDay() - 1);
    date.setDate(date.getDate() + dayOffset);
    const key = date.toISOString().slice(0, 10);
    const energy = energyByDate.get(key) ?? 0;
    return [label, energy];
  });

  const spendToday = (expensesRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  const checkin = checkinRes.data;

  return (
    <TodayView
      data={{
        energy: checkin?.energy ?? null,
        steps: checkin?.steps ?? null,
        waterMl: checkin?.water_ml ?? null,
        sleepMinutes: checkin?.sleep_minutes ?? null,
        mood: checkin?.mood ?? null,
        spendToday,
        mealsToday: mealsRes.count ?? 0,
        workoutsToday: workoutsRes.count ?? 0,
        weekEnergy,
        hasCheckin: Boolean(checkin),
        stepGoal: profileRes.data?.daily_step_goal ?? 8000,
        waterGoalMl: profileRes.data?.daily_water_goal_ml ?? 2400,
        healthFocus: profileRes.data?.health_focus ?? null,
      }}
    />
  );
}
