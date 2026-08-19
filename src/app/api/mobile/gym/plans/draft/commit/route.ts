import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { commitGymProgramDraft } from "@/lib/gym-plan-generate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const result = await commitGymProgramDraft(auth.supabase, auth.user.id);
  if (!result.ok) return jsonError(result.message, 400);
  return jsonOk({ plan: result.plan, message: result.message });
}
