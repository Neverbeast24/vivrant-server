export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam } from "@/lib/mobile/http";
import { archiveRecord } from "@/lib/archive";
import { writeAuditLog } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid entry id.", 400);

  const result = await archiveRecord(supabase, {
    table: "health_history",
    id,
    userId: user.id,
    auditAction: "health_history_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
