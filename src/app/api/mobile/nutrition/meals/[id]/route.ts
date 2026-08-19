import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";

export const runtime = "nodejs";

const mealSchema = z.object({
  meal_name: z.string().trim().min(1).max(120),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.coerce.number().int().min(0).optional(),
  protein_g: z.coerce.number().min(0).optional(),
  carbs_g: z.coerce.number().min(0).optional(),
  fat_g: z.coerce.number().min(0).optional(),
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
  if (id === null) return jsonError("Invalid meal id.");

  const body = await readJson(request);
  const parsed = mealSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in the meal details.", 400);

  const { data, error } = await supabase
    .from("nutrition_logs")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ meal: data });
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
  if (id === null) return jsonError("Invalid meal id.");

  const { error } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk();
}
