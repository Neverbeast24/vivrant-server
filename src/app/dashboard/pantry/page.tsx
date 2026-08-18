import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Pantry" };

export default async function PantryPage() {
  const [items, groceries] = await Promise.all([loadPantryItems(), loadOpenGroceries()]);
  return <PantryView mode="overview" items={items} groceries={groceries} />;
}
