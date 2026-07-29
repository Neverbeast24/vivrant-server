import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { generateSleepCoach } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const tip = await generateSleepCoach(context);

    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: tip.title,
      body: tip.body,
      score: tip.score,
      source: "sleep_coach",
    });

    return jsonOk({ coaching: tip, tip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not coach sleep.";
    return jsonError(message, 502);
  }
}
