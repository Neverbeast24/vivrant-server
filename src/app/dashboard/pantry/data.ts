import "server-only";

import { requireUser } from "@/lib/auth/roles";
import type { PantryItem } from "@/app/dashboard/pantry/shared";

export async function loadPantryItems() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("pantry_items")
    .select("id, name, category, stock_level, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as PantryItem[];
}

export async function loadOpenGroceries() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("grocery_items")
    .select("id, name, quantity, is_checked")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type { PantryItem } from "@/app/dashboard/pantry/shared";
export {
  PANTRY_CATEGORIES,
  LOW_STOCK_THRESHOLD,
  categoryLabel,
} from "@/app/dashboard/pantry/shared";
