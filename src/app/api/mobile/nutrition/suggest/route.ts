import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { suggestMeal } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/** AI meal idea from pantry stock and today's nutrition logs. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const context = await buildUserContext(user.id, { supabase });

  try {
    const suggestion = await suggestMeal(context);
    return jsonOk({ suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not suggest a meal.";
    return jsonError(message, 502);
  }
}
