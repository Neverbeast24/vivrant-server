"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateHabitSuggestions } from "@/lib/ai/gemini";
import { defaultWeekChallengeDates, syncChallengeProgress } from "@/lib/challenges/progress";
import { syncGoalProgress } from "@/lib/goals/progress";
import { createClient } from "@/lib/supabase/server";

const habitSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["nutrition", "movement", "sleep", "mindfulness", "hydration", "other"]),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  target_per_period: z.coerce.number().int().min(1).max(14).default(1),
});

function revalidateHabits() {
  revalidatePath("/dashboard/habits");
  revalidatePath("/dashboard/habits/challenges");
  revalidatePath("/dashboard");
}

export async function addHabit(formData: FormData) {
  const parsed = habitSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category") || "other",
    frequency: formData.get("frequency") || "daily",
    target_per_period: formData.get("target_per_period") || 1,
  });
  if (!parsed.success) return { ok: false, message: "Enter a habit title." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    ...parsed.data,
    active: true,
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "habit_created",
    entity: "habits",
    metadata: { title: parsed.data.title },
  });
  revalidateHabits();
  return { ok: true, message: "Habit added." };
}

export async function toggleHabitToday(habitId: number, done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const today = new Date().toISOString().slice(0, 10);
  if (done) {
    const { error } = await supabase.from("habit_logs").upsert(
      { habit_id: habitId, user_id: user.id, logged_on: today },
      { onConflict: "habit_id,logged_on" },
    );
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("logged_on", today);
    if (error) return { ok: false, message: error.message };
  }

  await syncGoalProgress(supabase, user.id);
  await syncChallengeProgress(supabase, user.id);
  revalidateHabits();
  return { ok: true, message: done ? "Habit checked." : "Habit unchecked." };
}

export async function deleteHabit(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidateHabits();
  return { ok: true, message: "Habit removed." };
}

export async function suggestHabits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const result = await generateHabitSuggestions(context);
    return { ok: true, message: "Habit ideas ready.", habits: result.habits };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not suggest habits.",
    };
  }
}

const challengeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  metric: z.enum(["habits", "workouts", "water", "sleep", "checkins", "gym"]),
  target_value: z.coerce.number().min(1).max(1_000_000),
  starts_on: z.string().date().optional(),
  ends_on: z.string().date().optional(),
});

export async function createChallenge(formData: FormData) {
  const defaults = defaultWeekChallengeDates();
  const parsed = challengeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    metric: formData.get("metric") || "habits",
    target_value: formData.get("target_value"),
    starts_on: formData.get("starts_on") || defaults.starts_on,
    ends_on: formData.get("ends_on") || defaults.ends_on,
  });
  if (!parsed.success) return { ok: false, message: "Fill in challenge details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      metric: parsed.data.metric,
      target_value: parsed.data.target_value,
      starts_on: parsed.data.starts_on ?? defaults.starts_on,
      ends_on: parsed.data.ends_on ?? defaults.ends_on,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await supabase.from("challenge_progress").insert({
    challenge_id: challenge.id,
    user_id: user.id,
    current_value: 0,
    completed: false,
  });

  await syncChallengeProgress(supabase, user.id);
  revalidateHabits();
  return { ok: true, message: "Weekly challenge created." };
}

export async function deleteChallenge(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("challenges").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidateHabits();
  return { ok: true, message: "Challenge removed." };
}

export async function refreshChallenges() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const result = await syncChallengeProgress(supabase, user.id);
  revalidateHabits();
  return {
    ok: true,
    message: result.updated
      ? `Updated ${result.updated} challenge${result.updated === 1 ? "" : "s"}.`
      : "No active challenges to sync.",
  };
}
