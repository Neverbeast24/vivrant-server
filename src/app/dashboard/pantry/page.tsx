import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems } from "@/app/dashboard/pantry/data";
import { requireUser } from "@/lib/auth/roles";
import { parseListOrder } from "@/lib/reorder";

export const metadata: Metadata = { title: "Pantry" };

export default async function PantryPage() {
  const { supabase, user } = await requireUser();
  const [items, groceries, settingsRes] = await Promise.all([
    loadPantryItems(),
    loadOpenGroceries(),
    supabase.from("user_settings").select("list_order").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <PantryView
      mode="overview"
      items={items}
      groceries={groceries}
      listOrder={parseListOrder(settingsRes.data?.list_order).pantry ?? []}
    />
  );
}
