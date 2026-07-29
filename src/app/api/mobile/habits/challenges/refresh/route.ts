import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonOk } from "@/lib/mobile/http";
import { syncChallengeProgress } from "@/lib/challenges/progress";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const result = await syncChallengeProgress(supabase, user.id);

  return jsonOk({ updated: result.updated });
}
