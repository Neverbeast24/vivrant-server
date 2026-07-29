import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson, parseIdParam } from "@/lib/mobile/http";

export const runtime = "nodejs";

const patchSchema = z.object({
  stock_level: z.coerce.number().int().min(0).max(100),
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
  if (id == null) return jsonError("Invalid pantry item id.", 400);

  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Stock must be between 0 and 100.", 400);

  const { data, error } = await supabase
    .from("pantry_items")
    .update({ stock_level: parsed.data.stock_level })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, category, stock_level, created_at")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ item: data });
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
  if (id == null) return jsonError("Invalid pantry item id.", 400);

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  return jsonOk();
}
