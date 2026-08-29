export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/** Weekly rollup: last 7 days of nutrition, movement, spend, and check-ins. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const since = daysAgoIso(6);
  const weekStart = since.slice(0, 10);
  const weekEnd = new Date().toISOString().slice(0, 10);

  const [nutritionRes, workoutRes, gymRes, expensesRes, checkinsRes] = await Promise.all([
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
      .from("gym_sessions")
      .select("duration_minutes")
      .eq("user_id", user.id)
      .gte("logged_at", since),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("spent_at", weekStart),
    supabase
      .from("daily_checkins")
      .select("steps, water_ml")
      .eq("user_id", user.id)
      .gte("checkin_date", weekStart),
  ]);

  const failed = [nutritionRes, workoutRes, gymRes, expensesRes, checkinsRes].find(
    (result) => result.error,
  );
  if (failed?.error) return jsonError(failed.error.message, 500);

  const nutritionRows = nutritionRes.data ?? [];
  const workoutRows = workoutRes.data ?? [];
  const gymRows = gymRes.data ?? [];
  const expenseRows = expensesRes.data ?? [];
  const checkinRows = checkinsRes.data ?? [];

  const calories = nutritionRows.reduce((sum, row) => sum + Number(row.calories ?? 0), 0);
  const protein_g = nutritionRows.reduce((sum, row) => sum + Number(row.protein_g ?? 0), 0);
  const workout_minutes =
    workoutRows.reduce((sum, row) => sum + Number(row.duration_minutes ?? 0), 0) +
    gymRows.reduce((sum, row) => sum + Number(row.duration_minutes ?? 0), 0);
  const workouts = workoutRows.length + gymRows.length;
  const spend = expenseRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const steps = checkinRows.reduce((sum, row) => sum + Number(row.steps ?? 0), 0);
  const water_ml = checkinRows.reduce((sum, row) => sum + Number(row.water_ml ?? 0), 0);

  return jsonOk({
    week_start: weekStart,
    week_end: weekEnd,
    calories,
    protein_g,
    workouts,
    workout_minutes,
    spend: Math.round(spend),
    checkins: checkinRows.length,
    meals: nutritionRows.length,
    steps,
    water_ml,
  });
}
