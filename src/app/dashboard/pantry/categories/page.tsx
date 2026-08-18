import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Pantry categories" };

export default async function PantryCategoriesPage() {
  const [items, groceries] = await Promise.all([loadPantryItems(), loadOpenGroceries()]);
  return <PantryView mode="categories" items={items} groceries={groceries} />;
}
