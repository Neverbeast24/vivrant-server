"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { recommendGymMachines } from "@/lib/ai/gemini";
import type { GymPlanPrefs } from "@/lib/health/body-metrics";
import { gymSessionFocusFromPlan } from "@/lib/gym";
import {
  dropKeptDay,
  keepPreviewDay,
  remainingTrainingDays,
} from "@/lib/gym-program-draft";
import { parseGymLiveSession, type GymLiveSessionDraft } from "@/lib/gym-live-session";
import {
  clearGymLiveSessionRow,
  commitGymProgramDraft,
  discardGymProgramDraft,
  loadGymLiveSessionRow,
  loadGymProgramDraft,
  previewGymProgram,
  saveGymLiveSessionRow,
  saveGymProgramDraftRow,
  updateSavedGymPlan,
} from "@/lib/gym-plan-generate";
import { createClient } from "@/lib/supabase/server";

const sessionExerciseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sets: z.string().trim().max(60).optional(),
  rest: z.string().trim().max(20).optional(),
  weight: z.string().trim().max(40).optional(),
  done: z.boolean().optional(),
  completed_sets: z.coerce.number().int().min(0).max(10).optional(),
});

const sessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  focus: z.string().trim().min(1).max(60),
  duration_minutes: z.coerce.number().int().min(5).max(180),
  calories_burned: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(400).optional(),
  exercises: z.string().trim().max(2000).optional(),
});

const programSessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  focus: z.string().trim().min(1).max(60),
  duration_minutes: z.coerce.number().int().min(5).max(180),
  calories_burned: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(400).optional(),
  exercises: z.array(sessionExerciseSchema).min(1).max(20),
});

function revalidateGymSessionPaths() {
  revalidatePath("/dashboard/gym");
  revalidatePath("/dashboard/gym/sessions");
  revalidatePath("/dashboard/gym/plans");
  revalidatePath("/dashboard/movement/log");
  revalidatePath("/dashboard/training");
  revalidatePath("/dashboard");
}

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

  const focus = gymSessionFocusFromPlan(parsed.data.focus);
  const exerciseLines = (parsed.data.exercises ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, sets: "as logged" }));

  const { error } = await supabase.from("gym_sessions").insert({
    user_id: user.id,
    title: parsed.data.title,
    focus,
    duration_minutes: parsed.data.duration_minutes,
    calories_burned: parsed.data.calories_burned ?? 0,
    notes: parsed.data.notes || null,
    exercises: exerciseLines,
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_session_created",
    entity: "gym_sessions",
    metadata: { title: parsed.data.title, focus },
  });

  revalidateGymSessionPaths();
  return { ok: true, message: "Gym session logged." };
}

export async function logProgramGymSession(input: unknown) {
  const parsed = programSessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check off at least one set, then save." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const focus = gymSessionFocusFromPlan(parsed.data.focus);
  const exercises = parsed.data.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets || "as logged",
    ...(ex.rest ? { rest: ex.rest } : {}),
    ...(ex.weight ? { weight: ex.weight } : {}),
    ...(ex.done != null ? { done: ex.done } : {}),
    ...(ex.completed_sets != null ? { completed_sets: ex.completed_sets } : {}),
  }));

  const { error } = await supabase.from("gym_sessions").insert({
    user_id: user.id,
    title: parsed.data.title,
    focus,
    duration_minutes: parsed.data.duration_minutes,
    calories_burned: parsed.data.calories_burned ?? 0,
    notes: parsed.data.notes || null,
    exercises,
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_session_created",
    entity: "gym_sessions",
    metadata: { title: parsed.data.title, focus, source: "program" },
  });

  revalidateGymSessionPaths();
  return { ok: true, message: "Workout saved from your program." };
}

export async function updateGymSession(formData: FormData) {
  const parsed = sessionSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({
    id: formData.get("id"),
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

  const focus = gymSessionFocusFromPlan(parsed.data.focus);
  const exerciseLines = (parsed.data.exercises ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, sets: "as logged" }));

  const { error } = await supabase
    .from("gym_sessions")
    .update({
      title: parsed.data.title,
      focus,
      duration_minutes: parsed.data.duration_minutes,
      calories_burned: parsed.data.calories_burned ?? 0,
      notes: parsed.data.notes || null,
      ...(exerciseLines.length ? { exercises: exerciseLines } : {}),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidateGymSessionPaths();
  return { ok: true, message: "Session updated." };
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

  revalidateGymSessionPaths();
  return { ok: true, message: "Session removed." };
}

export async function createAiGymPlan(input?: Partial<GymPlanPrefs>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const draft = await previewGymProgram(supabase, user.id, input);
    revalidatePath("/dashboard/gym");
    revalidatePath("/dashboard/gym/plans");
    const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
    return {
      ok: true,
      message: remaining.length
        ? `Workouts ready — keep the days you like, then generate the rest.`
        : "Workouts ready — keep the days you like, then save the program.",
      draft,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create a gym program.";
    return { ok: false, message };
  }
}

function revalidateGymPlanPaths() {
  revalidatePath("/dashboard/gym");
  revalidatePath("/dashboard/gym/plans");
  revalidatePath("/dashboard/gym/sessions");
  revalidatePath("/dashboard/movement/log");
  revalidatePath("/dashboard");
}

export async function loadGymProgramDraftAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in.", draft: null };
  const draft = await loadGymProgramDraft(supabase, user.id);
  return { ok: true, draft };
}

export async function keepGymProgramDay(iso: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const current = await loadGymProgramDraft(supabase, user.id);
  if (!current) return { ok: false, message: "Generate workouts first." };
  const draft = keepPreviewDay(current, Math.round(Number(iso)));
  await saveGymProgramDraftRow(supabase, user.id, draft);
  revalidateGymPlanPaths();
  return { ok: true, message: "Day kept for your program.", draft };
}

export async function dropGymProgramDay(iso: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const current = await loadGymProgramDraft(supabase, user.id);
  if (!current) return { ok: false, message: "No draft to update." };
  const draft = dropKeptDay(current, Math.round(Number(iso)));
  await saveGymProgramDraftRow(supabase, user.id, draft);
  revalidateGymPlanPaths();
  return { ok: true, message: "Day removed from your program.", draft };
}

export async function updateGymProgramDraft(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { parseGymProgramDraft } = await import("@/lib/gym-program-draft");
  const draft = parseGymProgramDraft(input);
  if (!draft) return { ok: false, message: "Could not save that program draft." };
  await saveGymProgramDraftRow(supabase, user.id, {
    ...draft,
    updated_at: new Date().toISOString(),
  });
  revalidateGymPlanPaths();
  return { ok: true, message: "Draft updated.", draft };
}

export async function saveGymProgramFromDraft() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const result = await commitGymProgramDraft(supabase, user.id);
  if (result.ok) revalidateGymPlanPaths();
  return result;
}

export async function discardGymProgramDraftAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  await discardGymProgramDraft(supabase, user.id);
  revalidateGymPlanPaths();
  return { ok: true, message: "Draft cleared." };
}

export async function loadGymLiveSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in.", session: null };
  const session = await loadGymLiveSessionRow(supabase, user.id);
  return { ok: true, session };
}

export async function saveGymLiveSessionAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const parsed = parseGymLiveSession(input);
  if (!parsed) return { ok: false, message: "Could not save this workout draft." };
  const draft: GymLiveSessionDraft = { ...parsed, updated_at: new Date().toISOString() };
  await saveGymLiveSessionRow(supabase, user.id, draft);
  return { ok: true, session: draft };
}

export async function clearGymLiveSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  await clearGymLiveSessionRow(supabase, user.id);
  return { ok: true };
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
        (row: { name: string; slug: string; muscle_group: string; equipment: string; difficulty: string }) =>
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

export async function updateGymPlan(input: unknown) {
  const parsed = z
    .object({
      id: z.coerce.number().int().positive(),
      title: z.string().trim().min(1).max(120),
      summary: z.string().trim().max(800).optional().nullable(),
      focus: z.string().trim().max(60).optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      days: z.array(z.unknown()).min(1).max(7),
      recommendations: z.array(z.string()).max(8).optional(),
      training_days: z.array(z.number().int().min(1).max(7)).max(6).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the program title and days, then save." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const result = await updateSavedGymPlan(supabase, user.id, parsed.data.id, {
    title: parsed.data.title,
    summary: parsed.data.summary,
    focus: parsed.data.focus,
    level: parsed.data.level,
    days: parsed.data.days,
    recommendations: parsed.data.recommendations,
    training_days: parsed.data.training_days,
  });
  if (!result.ok) return result;

  revalidatePath("/dashboard/gym");
  revalidatePath("/dashboard/gym/plans");
  revalidatePath("/dashboard/movement/log");
  revalidatePath("/dashboard/training");
  revalidatePath("/dashboard");
  return { ok: true, message: result.message };
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
  revalidatePath("/dashboard/gym/plans");
  revalidatePath("/dashboard/movement/log");
  return { ok: true, message: "Program removed." };
}
