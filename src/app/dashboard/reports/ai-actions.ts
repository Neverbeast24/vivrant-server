"use server";

import { revalidatePath } from "next/cache";
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

    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: story.title,
      body: `${story.story}\n\nFocus: ${(story.focuses ?? []).join(", ")}`,
      score: story.score,
      source: "weekly_story",
    });

    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/ai/insights");
    return { ok: true, message: "Weekly story written and saved.", story };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not write your weekly story.";
    return { ok: false, message };
  }
}
