import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Pantry items" };

export default async function PantryItemsPage() {
  const [items, groceries] = await Promise.all([loadPantryItems(), loadOpenGroceries()]);
  return <PantryView mode="items" items={items} groceries={groceries} />;
}
