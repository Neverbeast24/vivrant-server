"use server";

import { buildUserContext } from "@/lib/ai/context";
import { writeWeeklyStory } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function generateWeeklyStory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const story = await writeWeeklyStory(context);
    return { ok: true, message: "Weekly story written.", story };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not write your weekly story.";
    return { ok: false, message };
  }
}
