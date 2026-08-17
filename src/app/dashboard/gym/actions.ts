"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateGymPlan, recommendGymMachines } from "@/lib/ai/gemini";
import {
  applyRoutineOverrides,
  clampGymPlanPrefs,
  type GymPlanPrefs,
  type RoutineScaling,
} from "@/lib/health/body-metrics";
import { hydrateGymPlan, enrichGymPlanDays, serializeGymPlanDays } from "@/lib/gym";
import { createClient } from "@/lib/supabase/server";

function withPlanPrefs(context: string, prefs: GymPlanPrefs) {
  try {
    const parsed = JSON.parse(context) as { routine_scaling?: RoutineScaling };
    if (parsed.routine_scaling) {
      parsed.routine_scaling = applyRoutineOverrides(parsed.routine_scaling, prefs);
    }
    return JSON.stringify({
      ...parsed,
      plan_prefs: prefs,
    });
  } catch {
    return context;
  }
}

const sessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  focus: z.enum(["full_body", "strength", "fat_loss", "mobility", "endurance", "upper", "lower", "core"]),
  duration_minutes: z.coerce.number().int().min(5).max(180),
  calories_burned: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(400).optional(),
  exercises: z.string().trim().max(2000).optional(),
});

export async function logGymSession(formData: FormData) {
  const parsed = sessionSchema.safeParse({
    title: formData.get("title"),
    focus: formData.get("focus"),
    duration_minutes: formData.get("duration_minutes"),
    calories_burned: formData.get("calories_burned") || 0,
    notes: formData.get("notes") || undefined,
    exercises: formData.get("exercises") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Fill in a valid gym session." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const exerciseLines = (parsed.data.exercises ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, sets: "as logged" }));

  const { error } = await supabase.from("gym_sessions").insert({
    user_id: user.id,
    title: parsed.data.title,
    focus: parsed.data.focus,
    duration_minutes: parsed.data.duration_minutes,
    calories_burned: parsed.data.calories_burned ?? 0,
    notes: parsed.data.notes || null,
    exercises: exerciseLines,
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_session_created",
    entity: "gym_sessions",
    metadata: { title: parsed.data.title, focus: parsed.data.focus },
  });

  revalidatePath("/dashboard/gym");
  revalidatePath("/dashboard");
  return { ok: true, message: "Gym session logged." };
}

export async function deleteGymSession(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("gym_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_session_deleted",
    entity: "gym_sessions",
    entityId: String(id),
  });

  revalidatePath("/dashboard/gym");
  return { ok: true, message: "Session removed." };
}

export async function createAiGymPlan(input?: Partial<GymPlanPrefs>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const prefs = clampGymPlanPrefs(input);

  try {
    const [{ data: exercises }, rawContext] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("slug, name, muscle_group, equipment, difficulty")
        .order("name"),
      buildUserContext(user.id),
    ]);

    const context = withPlanPrefs(rawContext, prefs);
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

    const formatRow = (row: { name: string; muscle_group: string; equipment: string; difficulty: string; slug?: string }) =>
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
    if (error) return { ok: false, message: error.message };

    await writeAuditLog({
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
    });

    revalidatePath("/dashboard/gym");
    return { ok: true, message: "AI gym program saved.", plan: data ? hydrateGymPlan(data) : data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create a gym program.";
    return { ok: false, message };
  }
}

export async function recommendMachinesWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const [{ data: machines }, context] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("slug, name, muscle_group, equipment, difficulty, cues")
        .in("equipment", ["machine", "cable", "cardio_machine"])
        .order("name"),
      buildUserContext(user.id),
    ]);

    const catalog = (machines ?? [])
      .map(
        (row) =>
          `${row.name} | ${row.slug} | ${row.muscle_group} | ${row.equipment} | ${row.difficulty}`,
      )
      .join("\n");

    const recommendation = await recommendGymMachines(
      context,
      catalog ||
        "Leg press machine | leg-press | legs | machine | beginner\nLat pulldown machine | lat-pulldown | back | machine | beginner",
    );

    await writeAuditLog({
      action: "gym_machines_recommended",
      entity: "gym_exercises",
      metadata: {
        title: recommendation.title,
        count: recommendation.recommendations.length,
      },
    });

    return {
      ok: true,
      message: "Machine recommendations ready.",
      recommendation,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not recommend machines.";
    return { ok: false, message };
  }
}

export async function deleteGymPlan(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("gym_plans").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_plan_deleted",
    entity: "gym_plans",
    entityId: String(id),
  });

  revalidatePath("/dashboard/gym");
  return { ok: true, message: "Program removed." };
}
