"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const workoutSchema = z.object({
  title: z.string().min(1).max(120),
  activity_type: z.enum(["walk", "run", "strength", "cycle", "yoga", "other"]),
  duration_minutes: z.coerce.number().int().min(1),
  calories_burned: z.coerce.number().int().min(0).optional(),
});

export async function logWorkout(formData: FormData) {
  const parsed = workoutSchema.safeParse({
    title: formData.get("title"),
    activity_type: formData.get("activity_type"),
    duration_minutes: formData.get("duration_minutes"),
    calories_burned: formData.get("calories_burned") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Please fill in the workout details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("workout_logs").insert({
    user_id: user.id,
    ...parsed.data,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/movement");
  return { ok: true, message: "Workout logged." };
}

export async function deleteWorkout(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/movement");
  return { ok: true, message: "Workout removed." };
}
