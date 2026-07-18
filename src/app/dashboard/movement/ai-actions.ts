"use server";

import { buildUserContext } from "@/lib/ai/context";
import { suggestWorkout } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function suggestWorkoutWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const suggestion = await suggestWorkout(context);
    return { ok: true, message: "Workout suggestion ready.", suggestion };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not suggest a workout.";
    return { ok: false, message };
  }
}
