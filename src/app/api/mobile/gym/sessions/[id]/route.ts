import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, parseIdParam, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { gymSessionFocusFromPlan } from "@/lib/gym";

export const runtime = "nodejs";

const sessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  focus: z.string().trim().min(1).max(60),
  duration_minutes: z.coerce.number().int().min(5).max(180),
  calories_burned: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(400).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid session id.", 400);

  const body = await readJson(request);
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Fill in a valid gym session.", 400);

  const { data, error } = await supabase
    .from("gym_sessions")
    .update({
      title: parsed.data.title,
      focus: gymSessionFocusFromPlan(parsed.data.focus),
      duration_minutes: parsed.data.duration_minutes,
      calories_burned: parsed.data.calories_burned ?? 0,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ session: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid session id.", 400);

  const { error } = await supabase
    .from("gym_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "gym_session_deleted", entity: "gym_sessions", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
