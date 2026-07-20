"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateGymPlan } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

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

export async function createAiGymPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const [{ data: exercises }, context] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("name, muscle_group, equipment, difficulty")
        .order("name"),
      buildUserContext(user.id),
    ]);

    const catalog = (exercises ?? [])
      .map((row) => `${row.name} (${row.muscle_group}, ${row.equipment}, ${row.difficulty})`)
      .join("\n");
    const plan = await generateGymPlan(context, catalog || "bodyweight squat, push-up, plank, glute bridge");

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
    if (error) return { ok: false, message: error.message };

    await writeAuditLog({
      action: "gym_plan_created",
      entity: "gym_plans",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: plan.title, focus: plan.focus },
    });

    revalidatePath("/dashboard/gym");
    return { ok: true, message: "AI gym plan saved.", plan: data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create a gym plan.";
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
  return { ok: true, message: "Plan removed." };
}
