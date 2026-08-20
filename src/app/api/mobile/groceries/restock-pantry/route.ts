import type { SupabaseClient } from "@supabase/supabase-js";
import { groceryToPantryCategory } from "@/app/dashboard/pantry/shared";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";

export const runtime = "nodejs";

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

/** Restock the pantry from all currently checked grocery items. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: items } = await supabase
    .from("grocery_items")
    .select("name, category")
    .eq("user_id", user.id)
    .eq("is_checked", true);

  if (!items?.length) return jsonError("No checked items to restock.", 400);

  for (const item of items) {
    await restockPantryFromGrocery(supabase, user.id, item);
  }

  return jsonOk({ restocked: items.length });
}
