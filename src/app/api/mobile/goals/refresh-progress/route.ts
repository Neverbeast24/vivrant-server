export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonOk } from "@/lib/mobile/http";
import { syncGoalProgress } from "@/lib/goals/progress";

/** Refresh health_goals.current_value from the member's live logs. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const result = await syncGoalProgress(supabase, user.id);
  return jsonOk({ updated: result.updated });
}
