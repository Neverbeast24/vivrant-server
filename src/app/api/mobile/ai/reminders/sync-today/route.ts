export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { syncTodayLeftoverReminders } from "@/lib/reminders/today-leftovers";

/** Create/refresh an evening reminder from today’s unfinished items. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const result = await syncTodayLeftoverReminders(supabase, user.id);
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk({ message: result.message, reminder: result.reminder ?? null });
}
