import type { Metadata } from "next";
import { GroceriesView } from "@/components/dashboard/groceries";
import { loadGroceriesViewData } from "@/app/dashboard/groceries/data";

export const metadata: Metadata = { title: "Grocery meal plan" };

export default async function GroceryPlanPage() {
  const data = await loadGroceriesViewData();
  return <GroceriesView {...data} section="plan" />;
}
