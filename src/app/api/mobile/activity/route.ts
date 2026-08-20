import { listUserActivity } from "@/lib/activity";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const entity = new URL(request.url).searchParams.get("entity")?.trim() || undefined;
  const activity = await listUserActivity(supabase, user.id, { entity });
  if (!activity.ok) return jsonError(activity.message, 500);
  return jsonOk({ items: activity.items });
}
