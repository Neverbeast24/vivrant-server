import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { coachSpending } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/** AI budget coaching tip from recent expenses + monthly budget. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const advice = await coachSpending(context);
    return jsonOk({ advice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not coach spending right now.";
    return jsonError(message, 500);
  }
}
