import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id === null) return jsonError("Invalid habit id.");

  const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "habit_deleted", entity: "habits", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
