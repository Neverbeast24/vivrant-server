import type { Metadata } from "next";
import { LOW_STOCK_THRESHOLD } from "@/app/dashboard/pantry/shared";
import { GroceriesView } from "@/components/dashboard/groceries";
import {
  buildStaplePriceTrends,
  estimateGroceryPriceDetailed,
  getPhCalendarDate,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";
import { requireUser } from "@/lib/auth/roles";
import { parseListOrder } from "@/lib/reorder";

export const metadata: Metadata = { title: "Groceries" };

export default async function GroceriesPage() {
  const { supabase, user } = await requireUser();
  const ph = getPhCalendarDate();

  const [groceriesRes, profileRes, expensesRes, pantryRes, settingsRes] = await Promise.all([
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
    supabase
      .from("pantry_items")
      .select("id, name, category, stock_level")
      .eq("user_id", user.id)
      .lte("stock_level", LOW_STOCK_THRESHOLD)
      .order("stock_level", { ascending: true }),
    supabase.from("user_settings").select("list_order").eq("user_id", user.id).maybeSingle(),
  ]);

  // Reprice in memory for the response; persist patches without blocking render.
  const patches: Array<{
    id: string | number;
    patch: { estimated_price?: number; category?: string };
  }> = [];
  const items = (groceriesRes.data ?? []).map((row) => {
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
      patches.push({ id: row.id, patch });
    }
    return {
      ...row,
      category,
      estimated_price,
      price_low: breakdown.low,
      price_high: breakdown.high,
    };
  });

  if (patches.length) {
    void Promise.all(
      patches.map(({ id, patch }) =>
        supabase.from("grocery_items").update(patch).eq("id", id).eq("user_id", user.id),
      ),
    ).catch(() => null);
  }

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
      lowStock={pantryRes.data ?? []}
      listOrder={parseListOrder(settingsRes.data?.list_order).groceries ?? []}
    />
  );
}
