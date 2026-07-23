import type { Metadata } from "next";
import { TodayView, type TodayData } from "@/components/dashboard/today";
import { requireUser } from "@/lib/auth/roles";
import { processDueReminders } from "@/lib/reminders/process";

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
  await processDueReminders({ userId: user.id });

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);
  const dayStart = startOfDayIso();

  const [
    checkinRes,
    weekRes,
    expensesRes,
    mealsRes,
    workoutsRes,
    gymRes,
    profileRes,
    insightRes,
    habitsRes,
    habitLogsRes,
    reminderRes,
    allCheckinsRes,
    allMealsRes,
  ] = await Promise.all([
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
      .from("gym_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("logged_at", dayStart),
    supabase
      .from("profiles")
      .select("daily_step_goal, daily_water_goal_ml, health_focus, height_cm, weight_kg")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("ai_recommendations")
      .select("title, body, score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id)
      .eq("active", true),
    supabase
      .from("habit_logs")
      .select("habit_id, logged_on")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .limit(200),
    supabase
      .from("user_reminders")
      .select("title, next_fire_at")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .order("next_fire_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("nutrition_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
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

  const habits = habitsRes.data ?? [];
  const logs = habitLogsRes.data ?? [];
  const habitsDoneToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.logged_on === today),
  ).length;

  let habitStreak = 0;
  if (habits.length) {
    const cursor = new Date();
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      const allDone = habits.every((h) =>
        logs.some((l) => l.habit_id === h.id && l.logged_on === key),
      );
      if (!allDone) break;
      habitStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      if (habitStreak > 60) break;
    }
  }

  const checkin = checkinRes.data;
  const next = reminderRes.data;
  const profileComplete = Boolean(
    profileRes.data?.height_cm && profileRes.data?.weight_kg && profileRes.data?.health_focus,
  );
  const isNewMember =
    (allCheckinsRes.count ?? 0) < 3 && (allMealsRes.count ?? 0) < 2;

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
        gymToday: gymRes.count ?? 0,
        weekEnergy,
        hasCheckin: Boolean(checkin),
        stepGoal: profileRes.data?.daily_step_goal ?? 8000,
        waterGoalMl: profileRes.data?.daily_water_goal_ml ?? 2400,
        healthFocus: profileRes.data?.health_focus ?? null,
        habitStreak,
        habitsDoneToday,
        habitsTotal: habits.length,
        profileComplete,
        isNewMember,
        nextReminder: next
          ? {
              title: next.title,
              when: next.next_fire_at
                ? new Date(next.next_fire_at).toLocaleString("en-PH", {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "",
            }
          : null,
        latestInsight: insightRes.data
          ? {
              title: insightRes.data.title,
              body: insightRes.data.body,
              score: insightRes.data.score,
            }
          : null,
      }}
    />
  );
}
