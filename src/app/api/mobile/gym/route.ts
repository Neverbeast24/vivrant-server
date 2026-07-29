import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";

export const runtime = "nodejs";

/** Overview: session counts, totals (last 30 sessions), machine count, recent sessions. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const [exercises, sessions, plans] = await Promise.all([
    supabase.from("gym_exercises").select("id, equipment"),
    supabase
      .from("gym_sessions")
      .select("id, title, focus, duration_minutes, calories_burned, exercises, notes, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(30),
    supabase
      .from("gym_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (exercises.error) return jsonError(exercises.error.message, 500);
  if (sessions.error) return jsonError(sessions.error.message, 500);
  if (plans.error) return jsonError(plans.error.message, 500);

  const exerciseRows = exercises.data ?? [];
  const sessionRows = sessions.data ?? [];
  const machineGear = new Set(["machine", "cable", "cardio_machine"]);
  const machineCount = exerciseRows.filter((row) =>
    machineGear.has(row.equipment),
  ).length;
  const demoCount = exerciseRows.length - machineCount;

  return jsonOk({
    sessionCount: sessionRows.length,
    totalMinutes: sessionRows.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0),
    totalCalories: sessionRows.reduce((sum, row) => sum + (row.calories_burned ?? 0), 0),
    machineCount,
    demoCount,
    planCount: plans.count ?? 0,
    recentSessions: sessionRows.slice(0, 5),
  });
}
