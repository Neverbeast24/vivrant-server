import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { parseGymLiveSession } from "@/lib/gym-live-session";
import {
  clearGymLiveSessionRow,
  loadGymLiveSessionRow,
  saveGymLiveSessionRow,
} from "@/lib/gym-plan-generate";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const session = await loadGymLiveSessionRow(auth.supabase, auth.user.id);
  return jsonOk({ session });
}

export async function PUT(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const body = await readJson(request);
  const parsed = parseGymLiveSession(body);
  if (!parsed) return jsonError("Could not save this workout draft.", 400);
  const session = { ...parsed, updated_at: new Date().toISOString() };
  await saveGymLiveSessionRow(auth.supabase, auth.user.id, session);
  return jsonOk({ session });
}

export async function DELETE(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  await clearGymLiveSessionRow(auth.supabase, auth.user.id);
  return jsonOk();
}
