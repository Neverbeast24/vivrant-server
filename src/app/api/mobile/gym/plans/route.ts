import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { hydrateGymPlan, enrichGymPlanDays } from "@/lib/gym";

export const runtime = "nodejs";

/** List gym_plans. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const [{ data, error }, exercises] = await Promise.all([
    supabase
      .from("gym_plans")
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("gym_exercises").select("name, muscle_group, equipment").order("name"),
  ]);

  if (error) return jsonError(error.message, 500);
  const catalog = (exercises.data ?? []).map((row) => ({
    name: String(row.name),
    muscle_group: String(row.muscle_group),
    equipment: String(row.equipment),
  }));
  return jsonOk({
    plans: (data ?? []).map((row) => {
      const hydrated = hydrateGymPlan(row);
      return { ...hydrated, days: enrichGymPlanDays(hydrated.days, catalog) };
    }),
  });
}
