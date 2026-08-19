import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems, loadPantryListOrder } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Pantry items" };

export default async function PantryItemsPage() {
  const [items, groceries, listOrder] = await Promise.all([
    loadPantryItems(),
    loadOpenGroceries(),
    loadPantryListOrder(),
  ]);
  return <PantryView mode="items" items={items} groceries={groceries} listOrder={listOrder} />;
}
