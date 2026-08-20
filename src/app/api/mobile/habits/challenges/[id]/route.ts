import { archiveRecord } from "@/lib/archive";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam } from "@/lib/mobile/http";

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
  if (id === null) return jsonError("Invalid challenge id.");

  const result = await archiveRecord(supabase, {
    table: "challenges",
    id,
    userId: user.id,
    auditAction: "challenge_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
