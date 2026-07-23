import { buildRoutineScaling, pickGoalTargetDate } from "@/lib/health/body-metrics";
import { getPhCalendarDate, priceMarketContext } from "@/lib/groceries/ph-price-catalog";
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

  const [profile, checkins, meals, workouts, expenses, pantry, groceries, goals, history, gymSessions, habits, journal, reminders, challenges] =
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
        .select("checkin_date, energy, mood, steps, water_ml, sleep_minutes, sleep_quality, note")
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
        .select("name, quantity, category, is_checked, estimated_price")
        .eq("user_id", targetId)
        .eq("is_checked", false)
        .limit(20),
      supabase
        .from("health_goals")
        .select("title, category, target_value, current_value, unit, target_date, status")
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
      supabase
        .from("habits")
        .select("id, title, category, frequency, active")
        .eq("user_id", targetId)
        .eq("active", true)
        .limit(20),
      supabase
        .from("journal_entries")
        .select("entry_date, title, mood")
        .eq("user_id", targetId)
        .order("entry_date", { ascending: false })
        .limit(8),
      supabase
        .from("user_reminders")
        .select("title, kind, schedule_time, enabled, next_fire_at")
        .eq("user_id", targetId)
        .eq("enabled", true)
        .limit(12),
      supabase
        .from("challenges")
        .select("title, metric, target_value, starts_on, ends_on")
        .eq("user_id", targetId)
        .gte("ends_on", new Date().toISOString().slice(0, 10))
        .limit(8),
    ]);

  const profileData = profile.data ?? null;
  const goalsData = goals.data ?? [];
  const expenseRows = expenses.data ?? [];
  const groceryRows = groceries.data ?? [];
  const ph = getPhCalendarDate();
  const market = priceMarketContext();
  const spentThisMonth = expenseRows
    .filter((row) => String(row.spent_at ?? "").slice(0, 10) >= ph.monthStart)
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const monthlyBudget = Number(profileData?.monthly_health_budget ?? 2000);
  const openListTotal = groceryRows.reduce(
    (sum, row) => sum + Number(row.estimated_price ?? 0),
    0,
  );
  const remainingBudget = Math.max(0, monthlyBudget - spentThisMonth);
  const routine_scaling = buildRoutineScaling({
    height_cm: profileData?.height_cm ?? null,
    weight_kg: profileData?.weight_kg ?? null,
    goal_weight_kg: profileData?.goal_weight_kg ?? null,
    target_date: pickGoalTargetDate(goalsData),
  });

  return JSON.stringify(
    {
      today: ph.isoDate,
      timezone: market.timezone,
      ph_calendar: {
        year: ph.year,
        month: ph.month,
        month_label: ph.monthLabel,
        month_start: ph.monthStart,
      },
      grocery_price_market: market,
      health_profile: profileData,
      routine_scaling,
      budget_for_groceries: {
        currency: "PHP",
        monthly_health_budget: monthlyBudget,
        spent_this_month: Math.round(spentThisMonth),
        remaining_budget: Math.round(remainingBudget),
        open_list_estimated_total: Math.round(openListTotal),
        room_for_new_items: Math.max(0, Math.round(remainingBudget - openListTotal)),
        budget_month: ph.monthLabel,
      },
      checkins_last_7_days: checkins.data ?? [],
      meals_today: meals.data ?? [],
      workouts_today: workouts.data ?? [],
      recent_expenses: expenseRows,
      pantry_items: pantry.data ?? [],
      open_grocery_list: groceryRows,
      active_goals: goalsData,
      health_history: history.data ?? [],
      recent_gym_sessions: gymSessions.data ?? [],
      active_habits: habits.data ?? [],
      recent_journal: journal.data ?? [],
      scheduled_reminders: reminders.data ?? [],
      active_challenges: challenges.data ?? [],
    },
    null,
    2,
  );
}
