import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

function weekStartIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

/**
 * Refresh health_goals.current_value from live logs for a member.
 */
export async function syncGoalProgress(
  supabase: SupabaseClient,
  userId: string,
) {
  const weekStart = weekStartIsoDate();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: goals }, checkins, workouts, meals, journal, habitLogs] =
    await Promise.all([
      supabase
        .from("health_goals")
        .select("id, category, unit, target_value, current_value")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("daily_checkins")
        .select("checkin_date, steps, water_ml, sleep_minutes, mood")
        .eq("user_id", userId)
        .gte("checkin_date", weekStart),
      supabase
        .from("workout_logs")
        .select("id, duration_minutes, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", `${weekStart}T00:00:00`),
      supabase
        .from("nutrition_logs")
        .select("id, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", `${weekStart}T00:00:00`),
      supabase
        .from("journal_entries")
        .select("id, entry_date, mood")
        .eq("user_id", userId)
        .gte("entry_date", weekStart),
      supabase
        .from("habit_logs")
        .select("id, logged_on")
        .eq("user_id", userId)
        .gte("logged_on", weekStart),
    ]);

  const rows = goals ?? [];
  if (!rows.length) return { updated: 0 };

  const checkinRows = checkins.data ?? [];
  const todayCheckin = checkinRows.find((c) => c.checkin_date === today);
  const avgSleep =
    checkinRows.filter((c) => c.sleep_minutes != null).length > 0
      ? checkinRows.reduce((s, c) => s + Number(c.sleep_minutes ?? 0), 0) /
        checkinRows.filter((c) => c.sleep_minutes != null).length
      : 0;
  const latestSteps = Number(todayCheckin?.steps ?? 0);
  const latestWater = Number(todayCheckin?.water_ml ?? 0);
  const workoutCount = (workouts.data ?? []).length;
  const mealCount = (meals.data ?? []).length;
  const journalCount = (journal.data ?? []).length;
  const moodAvg =
    [...checkinRows, ...(journal.data ?? [])].filter((r) => r.mood != null).length > 0
      ? [...checkinRows, ...(journal.data ?? [])]
          .filter((r) => r.mood != null)
          .reduce((s, r) => s + Number(r.mood ?? 0), 0) /
        [...checkinRows, ...(journal.data ?? [])].filter((r) => r.mood != null).length
      : 0;
  const habitCount = (habitLogs.data ?? []).length;

  let updated = 0;
  for (const goal of rows) {
    const unit = (goal.unit ?? "").toLowerCase();
    let next = Number(goal.current_value ?? 0);

    switch (goal.category) {
      case "sleep":
        next = unit.includes("h")
          ? Math.round((avgSleep / 60) * 10) / 10
          : Math.round(avgSleep);
        break;
      case "movement":
        if (unit.includes("step")) next = latestSteps;
        else if (unit.includes("min"))
          next = (workouts.data ?? []).reduce(
            (s, w) => s + Number(w.duration_minutes ?? 0),
            0,
          );
        else next = workoutCount;
        break;
      case "nutrition":
        if (unit.includes("ml") || unit.includes("water")) next = latestWater;
        else next = mealCount;
        break;
      case "mindfulness":
        if (unit.includes("mood") || unit.includes("score"))
          next = Math.round(moodAvg * 10) / 10;
        else next = journalCount + habitCount;
        break;
      case "spending":
        break;
      default:
        if (unit.includes("habit")) next = habitCount;
        break;
    }

    if (Number(goal.current_value ?? 0) === next) continue;

    const { error } = await supabase
      .from("health_goals")
      .update({ current_value: next })
      .eq("id", goal.id)
      .eq("user_id", userId);
    if (!error) updated += 1;
  }

  return { updated };
}
