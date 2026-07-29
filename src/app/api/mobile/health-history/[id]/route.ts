export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam } from "@/lib/mobile/http";
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

  const { error } = await supabase
    .from("health_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "health_history_deleted", entity: "health_history", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
