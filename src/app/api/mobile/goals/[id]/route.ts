export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const patchSchema = z
  .object({
    status: z.enum(["active", "completed", "paused"]).optional(),
    current_value: z.coerce.number().min(0).max(1_000_000).optional(),
  })
  .refine((data) => data.status !== undefined || data.current_value !== undefined, {
    message: "Provide status or current_value.",
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
  if (id == null) return jsonError("Invalid goal id.", 400);

  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid goal update.", 400);
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.current_value !== undefined) patch.current_value = parsed.data.current_value;

  const { data, error } = await supabase
    .from("health_goals")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "goal_updated", entity: "health_goals", entityId: String(id), metadata: patch },
    supabase,
  );

  return jsonOk({ goal: data });
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
  if (id == null) return jsonError("Invalid goal id.", 400);

  const { error } = await supabase
    .from("health_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "goal_deleted", entity: "health_goals", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
