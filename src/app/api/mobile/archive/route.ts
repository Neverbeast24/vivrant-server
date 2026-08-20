import { listArchivedRecords, restoreArchivedRecord } from "@/lib/archive";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const archived = await listArchivedRecords(supabase, user.id);
  if (!archived.ok) return jsonError(archived.message, 500);
  return jsonOk({ items: archived.items });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const body = await readJson(request);
  const id = Number((body as { id?: unknown } | null)?.id);
  if (!Number.isFinite(id)) return jsonError("Invalid archived item.", 400);
  const result = await restoreArchivedRecord(supabase, { archiveId: id, userId: user.id });
  if (!result.ok) return jsonError(result.message, 400);
  return jsonOk({ message: result.message });
}
