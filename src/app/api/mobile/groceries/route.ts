import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { estimateGroceryPrice, suggestGroceryCategory } from "@/lib/groceries/ph-price-catalog";
import { applyIdOrder, fetchListOrder } from "@/lib/reorder";

export const runtime = "nodejs";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  category: z
    .enum(["produce", "protein", "dairy", "grains", "pantry", "snacks", "drinks", "household", "other"])
    .default("other"),
  estimated_price: z.coerce.number().min(0).max(50000).optional(),
});

/** List grocery items. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const [{ data, error }, listOrder] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    fetchListOrder(supabase, user.id),
  ]);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ items: applyIdOrder(data ?? [], listOrder.groceries) });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter an item name.", 400);

  // Prefer name-based category when the input still says produce/other (common mis-picks).
  const guessed = suggestGroceryCategory(parsed.data.name);
  const category =
    parsed.data.category === "other" ||
    (parsed.data.category === "produce" && guessed !== "produce" && guessed !== "other")
      ? guessed
      : parsed.data.category;

  const estimatedPrice =
    parsed.data.estimated_price != null && !Number.isNaN(parsed.data.estimated_price)
      ? Math.round(parsed.data.estimated_price)
      : estimateGroceryPrice(parsed.data.name, parsed.data.quantity, category);

  const { data, error } = await supabase
    .from("grocery_items")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity ?? null,
      category,
      estimated_price: estimatedPrice,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ item: data }, 201);
}
