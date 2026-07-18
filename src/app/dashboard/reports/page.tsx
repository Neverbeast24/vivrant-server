import type { Metadata } from "next";
import { ReportsView, type ReportsData } from "@/components/dashboard/reports";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Reports" };

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function dateKeyOffset(offset: number) {
  const date = new Date();
  const weekday = date.getDay() === 0 ? 6 : date.getDay() - 1;
  date.setDate(date.getDate() + (offset - weekday));
  return date.toISOString().slice(0, 10);
}

export default async function ReportsPage() {
  const { supabase, user } = await requireUser();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekIso = weekAgo.toISOString();

  const [checkins, meals, workouts, expenses, weekMeals, weekWorkouts, weekCheckins] =
    await Promise.all([
      supabase
        .from("daily_checkins")
        .select("energy")
        .eq("user_id", user.id)
        .gte("created_at", monthIso),
      supabase
        .from("nutrition_logs")
        .select("meal_name, meal_type, calories, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", monthIso)
        .order("logged_at", { ascending: false }),
      supabase
        .from("workout_logs")
        .select("title, activity_type, duration_minutes, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", monthIso)
        .order("logged_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("title, category, amount, spent_at")
        .eq("user_id", user.id)
        .gte("spent_at", monthIso)
        .order("spent_at", { ascending: false }),
      supabase
        .from("nutrition_logs")
        .select("logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", weekIso),
      supabase
        .from("workout_logs")
        .select("logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", weekIso),
      supabase
        .from("daily_checkins")
        .select("checkin_date")
        .eq("user_id", user.id)
        .gte("checkin_date", weekIso.slice(0, 10)),
    ]);

  const expensesTotal = (expenses.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  const energies = (checkins.data ?? [])
    .map((row) => Number(row.energy ?? 0))
    .filter((value) => value > 0);
  const avgEnergy = energies.length
    ? Math.round(energies.reduce((sum, value) => sum + value, 0) / energies.length)
    : null;

  // Weekly activity = count of logs per weekday (meals + workouts + check-ins).
  const perDay = new Map<string, number>();
  for (const row of weekMeals.data ?? []) {
    const key = String(row.logged_at).slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  for (const row of weekWorkouts.data ?? []) {
    const key = String(row.logged_at).slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  for (const row of weekCheckins.data ?? []) {
    const key = String(row.checkin_date).slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const maxPerDay = Math.max(1, ...perDay.values());
  const weekActivity: ReportsData["weekActivity"] = WEEK_LABELS.map((label, index) => {
    const count = perDay.get(dateKeyOffset(index)) ?? 0;
    return [label, Math.round((count / maxPerDay) * 100)];
  });

  const categoryMap = new Map<string, number>();
  for (const row of expenses.data ?? []) {
    const category = String(row.category ?? "other");
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + Number(row.amount ?? 0));
  }
  const categoryTotals = [...categoryMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentActivity: ReportsData["recentActivity"] = [
    ...(meals.data ?? []).slice(0, 4).map((row, index) => ({
      id: `meal-${index}`,
      title: row.meal_name as string,
      meta: `Meal · ${row.meal_type}`,
      right: `${row.calories ?? 0} kcal`,
    })),
    ...(workouts.data ?? []).slice(0, 4).map((row, index) => ({
      id: `workout-${index}`,
      title: row.title as string,
      meta: `Workout · ${row.activity_type}`,
      right: `${row.duration_minutes ?? 0} min`,
    })),
    ...(expenses.data ?? []).slice(0, 4).map((row, index) => ({
      id: `expense-${index}`,
      title: row.title as string,
      meta: `Expense · ${row.category}`,
      right: `₱${Number(row.amount ?? 0).toLocaleString()}`,
    })),
  ].slice(0, 8);

  return (
    <ReportsView
      data={{
        checkins: checkins.data?.length ?? 0,
        meals: meals.data?.length ?? 0,
        workouts: workouts.data?.length ?? 0,
        expensesTotal,
        weekActivity,
        categoryTotals,
        recentActivity,
        avgEnergy,
        totalWorkoutMinutes: (workouts.data ?? []).reduce(
          (sum, row) => sum + Number(row.duration_minutes ?? 0),
          0,
        ),
        totalCalories: (meals.data ?? []).reduce(
          (sum, row) => sum + Number(row.calories ?? 0),
          0,
        ),
      }}
    />
  );
}
