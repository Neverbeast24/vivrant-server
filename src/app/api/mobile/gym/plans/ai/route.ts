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
import {
  buildGymPlanAvailableExercises,
  constrainGymPlanToKnownMoves,
  enrichGymPlanDays,
  GYM_PLAN_CATALOG_FALLBACK,
  hydrateGymPlan,
  labelGymPlanDaysWithWeekdays,
  serializeGymPlanDays,
} from "@/lib/gym";

export const runtime = "nodejs";

/** Generate + save an AI gym plan. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  let body: {
    days_per_week?: number;
    training_days?: number[];
    session_minutes?: number;
    level?: string;
    known_machine_slugs?: string[];
    known_custom_exercises?: string[];
    avoid_targets?: string[];
  } = {};
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
        .select("slug, name, muscle_group, equipment, difficulty")
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

    const avoidSet = new Set(prefs.avoid_targets);
    const rows = (exercises ?? []).filter((row) => {
      if (!avoidSet.size) return true;
      return !avoidSet.has(String(row.muscle_group).toLowerCase());
    });
    const catalogItems = (exercises ?? []).map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      muscle_group: String(row.muscle_group),
      equipment: String(row.equipment),
    }));
    const { catalogText, knownRows, restrictToKnown } = buildGymPlanAvailableExercises(
      rows.map((row) => ({
        slug: String(row.slug),
        name: String(row.name),
        muscle_group: String(row.muscle_group),
        equipment: String(row.equipment),
        difficulty: String(row.difficulty),
      })),
      prefs,
    );

    const plan = await generateGymPlan(
      context,
      catalogText || GYM_PLAN_CATALOG_FALLBACK,
      prefs,
    );

    const days = labelGymPlanDaysWithWeekdays(
      enrichGymPlanDays(
        constrainGymPlanToKnownMoves(
          plan.days,
          knownRows,
          prefs.known_custom_exercises,
          catalogItems,
        ),
        restrictToKnown ? knownRows : catalogItems,
        prefs.avoid_targets,
      ),
      prefs.training_days,
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
        days: serializeGymPlanDays(days, plan.recommendations, prefs.training_days),
      })
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .single();
    if (error) return jsonError(error.message, 500);

    await writeAuditLog(
      {
        action: "gym_plan_created",
        entity: "gym_plans",
        entityId: data?.id != null ? String(data.id) : undefined,
        metadata: {
          title: plan.title,
          focus: plan.focus,
          level: plan.level,
          known_machine_count: prefs.known_machine_slugs.length,
          known_custom_count: prefs.known_custom_exercises.length,
          avoid_targets: prefs.avoid_targets,
        },
      },
      supabase,
    );

    return jsonOk({ plan: data ? hydrateGymPlan(data) : data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create a gym program.";
    return jsonError(message, 500);
  }
}
