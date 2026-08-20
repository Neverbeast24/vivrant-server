import type { SupabaseClient } from "@supabase/supabase-js";
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

/** audit_logs.metadata is jsonb, but some exports store it as a JSON string. */
function completeAuditLogs(rows: unknown[] | null) {
  return (rows ?? []).map((row) => {
    if (!row || typeof row !== "object") return row;
    const record = row as Record<string, unknown>;
    const metadata = record.metadata;
    if (typeof metadata !== "string") return record;
    try {
      return { ...record, metadata: JSON.parse(metadata) as unknown };
    } catch {
      return record;
    }
  });
}

export async function buildUserContext(
  userId: string,
  options?: { memberId?: string; supabase?: SupabaseClient },
) {
  const supabase = options?.supabase ?? (await createClient());
  const targetId = options?.memberId ?? userId;
  const since = dayStartIso();
  const weekStart = weekStartDate();

  const [profile, checkins, meals, workouts, expenses, pantry, groceries, goals, history, gymSessions, habits, journal, reminders, challenges, audit, gymPlans] =
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
        .order("logged_at", { ascending: false })
        .limit(40),
      supabase
        .from("workout_logs")
        .select("title, activity_type, duration_minutes, calories_burned, logged_at")
        .eq("user_id", targetId)
        .order("logged_at", { ascending: false })
        .limit(40),
      supabase
        .from("expenses")
        .select("title, category, amount, spent_at")
        .eq("user_id", targetId)
        .order("spent_at", { ascending: false })
        .limit(40),
      supabase
        .from("pantry_items")
        .select("name, category, stock_level")
        .eq("user_id", targetId)
        .order("stock_level", { ascending: true })
        .limit(80),
      supabase
        .from("grocery_items")
        .select("name, quantity, category, is_checked, estimated_price")
        .eq("user_id", targetId)
        .eq("is_checked", false)
        .limit(80),
      supabase
        .from("health_goals")
        .select("title, category, target_value, current_value, unit, target_date, status")
        .eq("user_id", targetId)
        .eq("status", "active")
        .limit(20),
      supabase
        .from("health_history")
        .select("recorded_at, weight_kg, height_cm, body_fat_pct, waist_cm, note")
        .eq("user_id", targetId)
        .order("recorded_at", { ascending: false })
        .limit(40),
      supabase
        .from("gym_sessions")
        .select("title, focus, duration_minutes, calories_burned, logged_at")
        .eq("user_id", targetId)
        .order("logged_at", { ascending: false })
        .limit(20),
      supabase
        .from("habits")
        .select("id, title, category, frequency, active")
        .eq("user_id", targetId)
        .eq("active", true)
        .limit(40),
      supabase
        .from("journal_entries")
        .select("entry_date, title, body, mood")
        .eq("user_id", targetId)
        .order("entry_date", { ascending: false })
        .limit(20),
      supabase
        .from("user_reminders")
        .select("title, kind, schedule_time, enabled, next_fire_at")
        .eq("user_id", targetId)
        .eq("enabled", true)
        .is("deleted_at", null)
        .limit(20),
      supabase
        .from("challenges")
        .select("title, metric, target_value, starts_on, ends_on")
        .eq("user_id", targetId)
        .gte("ends_on", new Date().toISOString().slice(0, 10))
        .limit(12),
      supabase
        .from("audit_logs")
        .select("id, actor_id, action, entity, entity_id, metadata, created_at")
        .eq("actor_id", targetId)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("gym_plans")
        .select("title, focus, level, days_per_week, summary, days, created_at")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .limit(6),
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

  // Explicit BMI block so every AI generate path can personalize (never ignore body metrics).
  const bmi_details = {
    bmi: routine_scaling.bmi,
    band: routine_scaling.band,
    band_label: routine_scaling.band_label,
    height_cm: routine_scaling.height_cm,
    weight_kg: routine_scaling.weight_kg,
    goal_weight_kg: routine_scaling.goal_weight_kg,
    kg_to_goal: routine_scaling.kg_to_goal,
    target_date: routine_scaling.target_date,
    weeks_remaining: routine_scaling.weeks_remaining,
    suggested_kg_per_week: routine_scaling.suggested_kg_per_week,
    pace_note: routine_scaling.pace_note,
    focus: routine_scaling.focus,
    intensity: routine_scaling.intensity,
    summary: routine_scaling.summary,
    available: routine_scaling.bmi != null,
  };

  const mealRows = meals.data ?? [];
  const workoutRows = workouts.data ?? [];

  // Pretty-printed complete context so Gemini receives every field, including audit history.
  return `COMPLETE USER CONTEXT (use every section; do not ignore BMI, logs, gym plans, or audit history)
${JSON.stringify(
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
      bmi_details,
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
      meals_today: mealRows.filter((row) => String(row.logged_at ?? "") >= since),
      recent_meals: mealRows,
      workouts_today: workoutRows.filter((row) => String(row.logged_at ?? "") >= since),
      recent_workouts: workoutRows,
      recent_expenses: expenseRows,
      pantry_items: pantry.data ?? [],
      open_grocery_list: groceryRows,
      active_goals: goalsData,
      health_history: history.data ?? [],
      recent_gym_sessions: gymSessions.data ?? [],
      gym_plans: gymPlans.data ?? [],
      active_habits: habits.data ?? [],
      recent_journal: journal.data ?? [],
      scheduled_reminders: reminders.data ?? [],
      active_challenges: challenges.data ?? [],
      audit_logs: completeAuditLogs(audit.data ?? []),
    },
    null,
    2,
  )}`;
}
