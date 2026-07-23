import type { Metadata } from "next";
import { GroceriesView } from "@/components/dashboard/groceries";
import {
  buildStaplePriceTrends,
  estimateGroceryPriceDetailed,
  getPhCalendarDate,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Groceries" };

export default async function GroceriesPage() {
  const { supabase, user } = await requireUser();
  const ph = getPhCalendarDate();

  const [groceriesRes, profileRes, expensesRes] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("monthly_health_budget")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("expenses")
      .select("amount, spent_at")
      .eq("user_id", user.id)
      .gte("spent_at", ph.monthStart),
  ]);

  // Refresh line estimates + fix obvious miscategorization (e.g. hotdog in produce).
  const items = await Promise.all(
    (groceriesRes.data ?? []).map(async (row) => {
      const guessed = suggestGroceryCategory(row.name);
      const category =
        !row.category ||
        row.category === "other" ||
        (row.category === "produce" && guessed !== "produce" && guessed !== "other")
          ? guessed
          : row.category;
      const breakdown = estimateGroceryPriceDetailed(row.name, row.quantity, category);
      const estimated_price = breakdown.estimated_price;
      const patch: { estimated_price?: number; category?: string } = {};
      if (Number(row.estimated_price ?? 0) !== estimated_price) {
        patch.estimated_price = estimated_price;
      }
      if (category !== row.category) {
        patch.category = category;
      }
      if (Object.keys(patch).length) {
        await supabase
          .from("grocery_items")
          .update(patch)
          .eq("id", row.id)
          .eq("user_id", user.id);
      }
      return {
        ...row,
        category,
        estimated_price,
        price_low: breakdown.low,
        price_high: breakdown.high,
      };
    }),
  );

  const spentThisMonth = (expensesRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const monthlyBudget = Number(profileRes.data?.monthly_health_budget ?? 2000);
  const stapleTrends = buildStaplePriceTrends(6);

  return (
    <GroceriesView
      items={items}
      monthlyBudget={monthlyBudget}
      spentThisMonth={spentThisMonth}
      priceMonthLabel={ph.monthLabel}
      stapleTrends={stapleTrends}
    />
  );
}
