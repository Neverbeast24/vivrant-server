import type { Metadata } from "next";
import { GroceriesView } from "@/components/dashboard/groceries";
import { loadGroceriesViewData } from "@/app/dashboard/groceries/data";

export const metadata: Metadata = { title: "Add groceries" };

export default async function GroceryAddPage() {
  const data = await loadGroceriesViewData();
  return <GroceriesView {...data} section="add" />;
}
