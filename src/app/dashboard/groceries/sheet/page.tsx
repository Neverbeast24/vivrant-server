import type { Metadata } from "next";
import { GroceriesSheet } from "@/components/dashboard/groceries-sheet";
import { loadGroceriesViewData } from "@/app/dashboard/groceries/data";

export const metadata: Metadata = { title: "Shopping sheet" };

export default async function GrocerySheetPage() {
  const { items } = await loadGroceriesViewData();
  return <GroceriesSheet items={items} />;
}
