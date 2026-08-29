import { writeExportBackup } from "@/lib/backup";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonOk } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const result = await writeExportBackup(supabase, user.id);
  return jsonOk({ dump: result.dump });
}
