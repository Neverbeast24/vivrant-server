import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { generateHabitSuggestions } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const result = await generateHabitSuggestions(context);
    return jsonOk({ habits: result.habits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not suggest habits.";
    return jsonError(message, 502);
  }
}
