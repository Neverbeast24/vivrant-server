import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems, loadPantryListOrder } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Low stock" };

export default async function PantryLowStockPage() {
  const [items, groceries, listOrder] = await Promise.all([
    loadPantryItems(),
    loadOpenGroceries(),
    loadPantryListOrder(),
  ]);
  return <PantryView mode="low-stock" items={items} groceries={groceries} listOrder={listOrder} />;
}
