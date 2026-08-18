import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { loadOpenGroceries, loadPantryItems } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Add pantry item" };

export default async function PantryAddPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, items, groceries] = await Promise.all([
    searchParams,
    loadPantryItems(),
    loadOpenGroceries(),
  ]);
  return (
    <PantryView mode="add" items={items} groceries={groceries} defaultCategory={category} />
  );
}
