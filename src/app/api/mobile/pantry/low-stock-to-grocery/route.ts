import { pantryToGroceryCategory } from "@/app/dashboard/pantry/shared";
import { estimateGroceryPrice } from "@/lib/groceries/ph-price-catalog";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";

export const runtime = "nodejs";

const LOW_STOCK_THRESHOLD = 25;

/** Push low-stock (<=25) pantry items onto the grocery list. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: low } = await supabase
    .from("pantry_items")
    .select("name, category")
    .eq("user_id", user.id)
    .lte("stock_level", LOW_STOCK_THRESHOLD);

  if (!low?.length) return jsonError("Nothing is low stock right now.", 400);

  const { data: open } = await supabase
    .from("grocery_items")
    .select("name")
    .eq("user_id", user.id)
    .eq("is_checked", false);

  const openNames = new Set((open ?? []).map((r) => r.name.trim().toLowerCase()));

  const toAdd = low.filter((item) => !openNames.has(item.name.trim().toLowerCase()));
  if (!toAdd.length) {
    return jsonOk({ added: 0 });
  }

  const { data, error } = await supabase
    .from("grocery_items")
    .insert(
      toAdd.map((item) => {
        const category = pantryToGroceryCategory(item.category || "other");
        return {
          user_id: user.id,
          name: item.name,
          category,
          quantity: "1",
          is_checked: false,
          estimated_price: estimateGroceryPrice(item.name, "1", category),
        };
      }),
    )
    .select("*");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ added: toAdd.length, items: data ?? [] });
}
