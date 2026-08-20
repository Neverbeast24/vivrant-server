import { writeExportBackup } from "@/lib/backup";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const result = await writeExportBackup(supabase, user.id);
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk({ dump: result.dump });
}
