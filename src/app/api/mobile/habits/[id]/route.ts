import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const habitSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z
    .enum(["nutrition", "movement", "sleep", "mindfulness", "hydration", "other"])
    .optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  target_per_period: z.coerce.number().int().min(1).max(14).optional(),
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
  if (id === null) return jsonError("Invalid habit id.");

  const body = await readJson(request);
  const parsed = habitSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a habit title.", 400);

  const { data, error } = await supabase
    .from("habits")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ habit: data });
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
  if (id === null) return jsonError("Invalid habit id.");

  const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "habit_deleted", entity: "habits", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
