import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { estimateGroceryPrice, suggestGroceryCategory } from "@/lib/groceries/ph-price-catalog";

export const runtime = "nodejs";

const CATEGORIES = new Set([
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "snacks",
  "drinks",
  "household",
  "other",
]);

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        category: z.string().trim().default("other"),
        quantity: z.string().trim().default("1"),
        estimated_price: z.coerce.number().min(0).optional(),
      }),
    )
    .min(1),
});

/** Add up to 12 plan items to the grocery list. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("No items to add.", 400);

  const rows = parsed.data.items.slice(0, 12).map((item) => {
    const name = item.name.slice(0, 120);
    const quantity = item.quantity.slice(0, 40);
    const guessed = suggestGroceryCategory(name);
    const category = !CATEGORIES.has(item.category)
      ? guessed
      : item.category === "other" ||
          (item.category === "produce" && guessed !== "produce" && guessed !== "other")
        ? guessed
        : item.category;
    const price =
      item.estimated_price != null && item.estimated_price > 0
        ? Math.round(item.estimated_price)
        : estimateGroceryPrice(name, quantity, category);
    return {
      user_id: user.id,
      name,
      quantity,
      category,
      estimated_price: price,
    };
  });

  const { data, error } = await supabase.from("grocery_items").insert(rows).select("*");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ items: data ?? [] }, 201);
}
