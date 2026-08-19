export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { dayStartIso, jsonOk, todayDate } from "@/lib/mobile/http";
import { processDueReminders } from "@/lib/reminders/process";
import { hydrateGymPlan, summarizeTodaysProgram, type GymPlan } from "@/lib/gym";
import { applyIdOrder, fetchListOrder } from "@/lib/reorder";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const today = todayDate();
  const since = dayStartIso();

  // Hobby cron is daily-only — fire this member's due reminders on Today open
  // (same pattern as the web reminders page).
  void processDueReminders({ userId: user.id, client: supabase, limit: 20 }).catch(
    () => undefined,
  );

  const [
    checkinRes,
    nutritionRes,
    workoutRes,
    goalsRes,
    notificationsRes,
    plansRes,
    habitsRes,
    habitLogsRes,
    groceryRes,
    listOrder,
  ] = await Promise.all([
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .maybeSingle(),
      supabase
        .from("nutrition_logs")
        .select("calories, protein_g")
        .eq("user_id", user.id)
        .gte("logged_at", since),
      supabase
        .from("workout_logs")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("logged_at", since),
      supabase
        .from("health_goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("gym_plans")
        .select("id, title, focus, level, days_per_week, summary, days, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("habits").select("id, title").eq("user_id", user.id).eq("active", true),
      supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("logged_on", today),
      supabase
        .from("grocery_items")
        .select("id, name, quantity")
        .eq("user_id", user.id)
        .eq("is_checked", false)
        .order("created_at", { ascending: false }),
    fetchListOrder(supabase, user.id),
    ]);

  const checkin = checkinRes.data ?? null;
  const nutritionRows = nutritionRes.data ?? [];
  const workoutRows = workoutRes.data ?? [];

  const calories = nutritionRows.reduce((sum, row) => sum + Number(row.calories ?? 0), 0);
  const protein_g = nutritionRows.reduce((sum, row) => sum + Number(row.protein_g ?? 0), 0);
  const workouts_minutes = workoutRows.reduce(
    (sum, row) => sum + Number(row.duration_minutes ?? 0),
    0,
  );
  const habits = applyIdOrder(habitsRes.data ?? [], listOrder.habits);
  const habitLogs = habitLogsRes.data ?? [];
  const habits_total = habits.length;
  const habits_done_today = habits.filter((habit) =>
    habitLogs.some((log) => log.habit_id === habit.id),
  ).length;
  const doneIds = new Set(habitLogs.map((log) => log.habit_id));

  return jsonOk({
    checkin,
    calories,
    protein_g,
    steps: checkin?.steps ?? 0,
    water_ml: checkin?.water_ml ?? 0,
    workouts_minutes,
    active_goals: goalsRes.count ?? 0,
    unread_notifications: notificationsRes.count ?? 0,
    meals_today: nutritionRows.length,
    workouts_today: workoutRows.length,
    habits_done_today,
    habits_total,
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      done_today: doneIds.has(habit.id),
    })),
    groceries: applyIdOrder(groceryRes.data ?? [], listOrder.groceries).slice(0, 8),
    program: summarizeTodaysProgram(
      ((plansRes.data ?? []) as GymPlan[]).map((row) => hydrateGymPlan(row)),
    ),
  });
}
