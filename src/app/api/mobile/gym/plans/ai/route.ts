import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateGymPlan } from "@/lib/ai/gemini";
import {
  applyRoutineOverrides,
  clampGymPlanPrefs,
  type RoutineScaling,
} from "@/lib/health/body-metrics";

export const runtime = "nodejs";

/** Generate + save an AI gym plan. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  let body: { days_per_week?: number; session_minutes?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const prefs = clampGymPlanPrefs(body);

  try {
    const [{ data: exercises }, rawContext] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("name, muscle_group, equipment, difficulty")
        .order("name"),
      buildUserContext(user.id, { supabase }),
    ]);

    let context = rawContext;
    try {
      const parsed = JSON.parse(rawContext) as { routine_scaling?: RoutineScaling };
      if (parsed.routine_scaling) {
        parsed.routine_scaling = applyRoutineOverrides(parsed.routine_scaling, prefs);
      }
      context = JSON.stringify({ ...parsed, plan_prefs: prefs });
    } catch {
      // keep raw context
    }

    const catalog = (exercises ?? [])
      .map((row) => `${row.name} (${row.muscle_group}, ${row.equipment}, ${row.difficulty})`)
      .join("\n");
    const plan = await generateGymPlan(
      context,
      catalog || "bodyweight squat, push-up, plank, glute bridge, leg press, lat pulldown",
      prefs,
    );

    const { data, error } = await supabase
      .from("gym_plans")
      .insert({
        user_id: user.id,
        title: plan.title,
        focus: plan.focus,
        level: plan.level,
        days_per_week: plan.days_per_week,
        summary: plan.summary,
        days: plan.days,
      })
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .single();
    if (error) return jsonError(error.message, 500);

    await writeAuditLog(
      {
        action: "gym_plan_created",
        entity: "gym_plans",
        entityId: data?.id != null ? String(data.id) : undefined,
        metadata: { title: plan.title, focus: plan.focus },
      },
      supabase,
    );

    return jsonOk({ plan: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create a gym plan.";
    return jsonError(message, 500);
  }
}
