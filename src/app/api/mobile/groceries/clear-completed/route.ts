import { archiveMatching } from "@/lib/archive";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";

export const runtime = "nodejs";

/** Delete all checked grocery items. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const result = await archiveMatching(supabase, {
    table: "grocery_items",
    userId: user.id,
    match: { is_checked: true },
    auditAction: "grocery_item_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
