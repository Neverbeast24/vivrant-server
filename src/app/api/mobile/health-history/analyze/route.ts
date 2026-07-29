export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { analyzeHealthHistory } from "@/lib/ai/gemini";

/** AI read on the member's weight/height trend. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const insight = await analyzeHealthHistory(context);
    return jsonOk({ insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not analyze health history.";
    return jsonError(message, 500);
  }
}
