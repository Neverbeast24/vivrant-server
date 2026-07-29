import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { planGroceriesFromPantry } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/** AI grocery + meal plan built from pantry stock and the open list. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const plan = await planGroceriesFromPantry(context);
    return jsonOk({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build a grocery plan.";
    return jsonError(message, 500);
  }
}
