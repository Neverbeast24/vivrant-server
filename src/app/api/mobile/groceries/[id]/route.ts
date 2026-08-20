import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { archiveRecord } from "@/lib/archive";
import { groceryToPantryCategory } from "@/app/dashboard/pantry/shared";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson, parseIdParam } from "@/lib/mobile/http";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    is_checked: z.boolean().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    quantity: z.string().trim().max(40).optional().nullable(),
    category: z
      .enum(["produce", "protein", "dairy", "grains", "pantry", "snacks", "drinks", "household", "other"])
      .optional(),
    estimated_price: z.coerce.number().min(0).max(50000).optional().nullable(),
  })
  .refine(
    (data) =>
      data.is_checked !== undefined ||
      data.name !== undefined ||
      data.quantity !== undefined ||
      data.category !== undefined ||
      data.estimated_price !== undefined,
    { message: "Nothing to update." },
  );

async function restockPantryFromGrocery(
  supabase: SupabaseClient,
  userId: string,
  item: { name: string; category: string | null },
) {
  const name = item.name.trim();
  if (!name) return;
  const { data: existing } = await supabase
    .from("pantry_items")
    .select("id, stock_level")
    .eq("user_id", userId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("pantry_items")
      .update({ stock_level: Math.min(100, Math.max(existing.stock_level ?? 0, 80)) })
      .eq("id", existing.id)
      .eq("user_id", userId);
  } else {
    await supabase.from("pantry_items").insert({
      user_id: userId,
      name,
      category: groceryToPantryCategory(item.category || "other"),
      stock_level: 80,
    });
  }
}

/** Toggle is_checked; restocks the pantry when an item is checked off. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid item id.", 400);

  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Nothing to update.", 400);

  const { data: item } = await supabase
    .from("grocery_items")
    .select("id, name, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (parsed.data.is_checked !== undefined) patch.is_checked = parsed.data.is_checked;
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.quantity !== undefined) patch.quantity = parsed.data.quantity;
  if (parsed.data.category !== undefined) patch.category = parsed.data.category;
  if (parsed.data.estimated_price !== undefined) patch.estimated_price = parsed.data.estimated_price;

  const { data, error } = await supabase
    .from("grocery_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  if (parsed.data.is_checked && item) {
    await restockPantryFromGrocery(supabase, user.id, item);
  }

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
  if (id == null) return jsonError("Invalid item id.", 400);

  const result = await archiveRecord(supabase, {
    table: "grocery_items",
    id,
    userId: user.id,
    auditAction: "grocery_item_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
