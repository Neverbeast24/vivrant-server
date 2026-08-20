export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { archiveRecord } from "@/lib/archive";
import { writeAuditLog } from "@/lib/audit";

const patchSchema = z
  .object({
    status: z.enum(["active", "completed", "paused"]).optional(),
    current_value: z.coerce.number().min(0).max(1_000_000).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    category: z.enum(["nutrition", "movement", "sleep", "mindfulness", "spending", "other"]).optional(),
    target_value: z.coerce.number().min(0).optional().nullable(),
    unit: z.string().trim().max(40).optional().nullable(),
    target_date: z.string().date().optional().nullable(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Nothing to update." },
  );

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
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (parsed.data.target_value !== undefined) patch.target_value = parsed.data.target_value;
  if (parsed.data.unit !== undefined) patch.unit = parsed.data.unit;
  if (parsed.data.target_date !== undefined) patch.target_date = parsed.data.target_date;

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

  const result = await archiveRecord(supabase, {
    table: "health_goals",
    id,
    userId: user.id,
    auditAction: "goal_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
