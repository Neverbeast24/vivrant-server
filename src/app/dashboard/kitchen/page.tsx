import type { Metadata } from "next";
import { KitchenHub } from "@/components/dashboard/kitchen-hub";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Kitchen" };

export default async function KitchenPage() {
  const { supabase, user } = await requireUser();

  const [groceriesRes, pantryRes] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("id, name, quantity, is_checked")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pantry_items")
      .select("id, name, category, stock_level")
      .eq("user_id", user.id)
      .order("stock_level", { ascending: true }),
  ]);

  return (
    <KitchenHub groceries={groceriesRes.data ?? []} pantry={pantryRes.data ?? []} />
  );
}
