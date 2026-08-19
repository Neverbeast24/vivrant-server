import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { dropKeptDay, keepPreviewDay, parseGymProgramDraft } from "@/lib/gym-program-draft";
import {
  discardGymProgramDraft,
  loadGymProgramDraft,
  saveGymProgramDraftRow,
} from "@/lib/gym-plan-generate";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const draft = await loadGymProgramDraft(auth.supabase, auth.user.id);
  return jsonOk({ draft });
}

export async function PUT(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const body = await readJson(request);
  const draft = parseGymProgramDraft(body);
  if (!draft) return jsonError("Could not save that program draft.", 400);
  await saveGymProgramDraftRow(auth.supabase, auth.user.id, {
    ...draft,
    updated_at: new Date().toISOString(),
  });
  return jsonOk({ draft });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const body = (await readJson(request)) as { action?: string; iso?: number } | null;
  const action = String(body?.action ?? "").toLowerCase();
  const current = await loadGymProgramDraft(auth.supabase, auth.user.id);
  if (!current) return jsonError("Generate workouts first.", 400);
  const iso = Math.round(Number(body?.iso));
  if (action === "keep") {
    if (!Number.isFinite(iso) || iso < 1 || iso > 7) return jsonError("Pick a weekday to keep.", 400);
    const draft = keepPreviewDay(current, iso);
    await saveGymProgramDraftRow(auth.supabase, auth.user.id, draft);
    return jsonOk({ draft });
  }
  if (action === "drop") {
    if (!Number.isFinite(iso) || iso < 1 || iso > 7) return jsonError("Pick a weekday to remove.", 400);
    const draft = dropKeptDay(current, iso);
    await saveGymProgramDraftRow(auth.supabase, auth.user.id, draft);
    return jsonOk({ draft });
  }
  return jsonError("Unknown draft action.", 400);
}

export async function DELETE(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  await discardGymProgramDraft(auth.supabase, auth.user.id);
  return jsonOk();
}
