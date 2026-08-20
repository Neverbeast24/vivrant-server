import type { Metadata } from "next";
import { PantrySheet } from "@/components/dashboard/pantry-sheet";
import { loadPantryItems } from "@/app/dashboard/pantry/data";

export const metadata: Metadata = { title: "Pantry sheet" };

export default async function PantrySheetPage() {
  const items = await loadPantryItems();
  return <PantrySheet items={items} />;
}
