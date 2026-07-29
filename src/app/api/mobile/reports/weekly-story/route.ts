export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { writeWeeklyStory } from "@/lib/ai/gemini";

/** Generate + save this week's AI wellbeing story. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const story = await writeWeeklyStory(context);

    const { error } = await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: story.title,
      body: `${story.story}\n\nFocus: ${(story.focuses ?? []).join(", ")}`,
      score: story.score,
      source: "weekly_story",
    });
    if (error) return jsonError(error.message, 500);

    return jsonOk({ story });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not write your weekly story.";
    return jsonError(message, 500);
  }
}
