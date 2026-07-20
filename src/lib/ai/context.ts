import { createClient } from "@/lib/supabase/server";

function dayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weekStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export async function buildUserContext(userId: string, options?: { memberId?: string }) {
  const supabase = await createClient();
  const targetId = options?.memberId ?? userId;
  const since = dayStartIso();
  const weekStart = weekStartDate();

  const [profile, checkins, meals, workouts, expenses, pantry, groceries, goals, history, gymSessions] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, birth_date, sex, height_cm, weight_kg, goal_weight_kg, activity_level, health_focus, daily_step_goal, daily_water_goal_ml, monthly_health_budget, bio",
        )
        .eq("user_id", targetId)
        .maybeSingle(),
      supabase
        .from("daily_checkins")
        .select("checkin_date, energy, mood, steps, water_ml, sleep_minutes, note")
        .eq("user_id", targetId)
        .gte("checkin_date", weekStart)
        .order("checkin_date", { ascending: false }),
      supabase
        .from("nutrition_logs")
        .select("meal_name, meal_type, calories, protein_g, carbs_g, fat_g, logged_at")
        .eq("user_id", targetId)
        .gte("logged_at", since)
        .order("logged_at", { ascending: false })
        .limit(12),
      supabase
        .from("workout_logs")
        .select("title, activity_type, duration_minutes, calories_burned, logged_at")
        .eq("user_id", targetId)
        .gte("logged_at", since)
        .order("logged_at", { ascending: false })
        .limit(12),
      supabase
        .from("expenses")
        .select("title, category, amount, spent_at")
        .eq("user_id", targetId)
        .order("spent_at", { ascending: false })
        .limit(12),
      supabase
        .from("pantry_items")
        .select("name, category, stock_level")
        .eq("user_id", targetId)
        .order("stock_level", { ascending: true })
        .limit(20),
      supabase
        .from("grocery_items")
        .select("name, quantity, category, is_checked")
        .eq("user_id", targetId)
        .eq("is_checked", false)
        .limit(20),
      supabase
        .from("health_goals")
        .select("title, category, target_value, current_value, unit, status")
        .eq("user_id", targetId)
        .eq("status", "active")
        .limit(12),
      supabase
        .from("health_history")
        .select("recorded_at, weight_kg, height_cm, body_fat_pct, waist_cm, note")
        .eq("user_id", targetId)
        .order("recorded_at", { ascending: false })
        .limit(12),
      supabase
        .from("gym_sessions")
        .select("title, focus, duration_minutes, calories_burned, logged_at")
        .eq("user_id", targetId)
        .order("logged_at", { ascending: false })
        .limit(8),
    ]);

  return JSON.stringify(
    {
      today: new Date().toISOString().slice(0, 10),
      timezone: "Asia/Manila",
      health_profile: profile.data ?? null,
      checkins_last_7_days: checkins.data ?? [],
      meals_today: meals.data ?? [],
      workouts_today: workouts.data ?? [],
      recent_expenses: expenses.data ?? [],
      pantry_items: pantry.data ?? [],
      open_grocery_list: groceries.data ?? [],
      active_goals: goals.data ?? [],
      health_history: history.data ?? [],
      recent_gym_sessions: gymSessions.data ?? [],
    },
    null,
    2,
  );
}
