import type { Metadata } from "next";
import { KitchenHub } from "@/components/dashboard/kitchen-hub";
import { LOW_STOCK_THRESHOLD } from "@/app/dashboard/pantry/shared";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Kitchen" };

export default async function KitchenPage() {
  const { supabase, user } = await requireUser();

  const [groceriesRes, pantryRes] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("id, is_checked")
      .eq("user_id", user.id),
    supabase
      .from("pantry_items")
      .select("id, stock_level")
      .eq("user_id", user.id),
  ]);

  const groceries = groceriesRes.data ?? [];
  const pantry = pantryRes.data ?? [];
  const groceryOpen = groceries.filter((g) => !g.is_checked).length;
  const lowStockCount = pantry.filter((p) => Number(p.stock_level ?? 0) <= LOW_STOCK_THRESHOLD).length;

  return (
    <KitchenHub
      groceryOpen={groceryOpen}
      groceryTotal={groceries.length}
      pantryCount={pantry.length}
      lowStockCount={lowStockCount}
    />
  );
}
