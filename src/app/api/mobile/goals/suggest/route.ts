export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { suggestGoals } from "@/lib/ai/gemini";

/** Suggest up to 3 measurable goals from the member's recent activity. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const goals = await suggestGoals(context);
    return jsonOk({ goals });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not suggest goals right now.";
    return jsonError(message, 500);
  }
}
