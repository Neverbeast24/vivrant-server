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
import { enrichGymPlanDays, hydrateGymPlan, serializeGymPlanDays } from "@/lib/gym";

export const runtime = "nodejs";

/** Generate + save an AI gym plan. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  let body: {
    days_per_week?: number;
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
    const knownSet = new Set(prefs.known_machine_slugs);
    const knownRows = knownSet.size
      ? rows.filter((row) => knownSet.has(String(row.slug).toLowerCase()))
      : [];
    const otherRows = knownSet.size
      ? rows.filter((row) => !knownSet.has(String(row.slug).toLowerCase()))
      : rows;

    const formatRow = (row: {
      name: string;
      muscle_group: string;
      equipment: string;
      difficulty: string;
      slug?: string;
    }) =>
      `${row.name}${row.slug ? ` [${row.slug}]` : ""} (${row.muscle_group}, ${row.equipment}, ${row.difficulty})`;

    const catalogParts: string[] = [];
    if (prefs.avoid_targets.length) {
      catalogParts.push(
        `AVOID THESE TARGETS (do not program primary work for): ${prefs.avoid_targets.join(", ")}`,
      );
    }
    if (knownRows.length || prefs.known_custom_exercises.length) {
      const knownBlock = [
        knownRows.length ? knownRows.map(formatRow).join("\n") : null,
        prefs.known_custom_exercises.length
          ? prefs.known_custom_exercises.map((name) => `${name} (custom, user-typed)`).join("\n")
          : null,
      ]
        .filter(Boolean)
        .join("\n");
      catalogParts.push(
        "KNOWN EXERCISES (user checked / typed these — prioritize):\n" + knownBlock,
      );
      catalogParts.push(
        "OTHER CATALOG (use sparingly if needed):\n" + otherRows.map(formatRow).join("\n"),
      );
    } else {
      catalogParts.push(otherRows.map(formatRow).join("\n"));
    }

    const plan = await generateGymPlan(
      context,
      catalogParts.join("\n\n") ||
        "bodyweight squat, push-up, plank, glute bridge, leg press, lat pulldown",
      prefs,
    );

    const days = enrichGymPlanDays(
      plan.days,
      (exercises ?? []).map((row) => ({
        name: String(row.name),
        muscle_group: String(row.muscle_group),
        equipment: String(row.equipment),
      })),
      prefs.avoid_targets,
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
        days: serializeGymPlanDays(days, plan.recommendations),
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
