"use server";

import { revalidatePath } from "next/cache";
import { buildUserContext } from "@/lib/ai/context";
import {
  estimateGroceryCostWithAi,
  planGroceriesFromPantry,
} from "@/lib/ai/gemini";
import {
  estimateGroceryPrice,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";
import { createClient } from "@/lib/supabase/server";

const categories = new Set([
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "snacks",
  "drinks",
  "household",
  "other",
]);

export async function generateSmartGroceryPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const plan = await planGroceriesFromPantry(context);
    return { ok: true, message: "Smart grocery plan ready.", plan };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build a grocery plan.";
    return { ok: false, message };
  }
}

export async function estimateItemCostWithAi(input: {
  name: string;
  quantity?: string;
  category?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };

  const name = input.name?.trim();
  if (!name) return { ok: false as const, message: "Enter an item name first." };

  try {
    const context = await buildUserContext(user.id);
    const estimate = await estimateGroceryCostWithAi({
      name,
      quantity: input.quantity,
      category: input.category,
      context,
    });
    return {
      ok: true as const,
      message: `AI cost ~₱${estimate.estimated_price} (${estimate.low}–${estimate.high}).`,
      estimate,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not estimate cost right now.";
    return { ok: false as const, message };
  }
}

export async function addPlanItemsToList(
  items: { name: string; category: string; quantity: string; estimated_price?: number }[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  if (!items.length) return { ok: false, message: "No items to add." };

  const rows = items.slice(0, 12).map((item) => {
    const name = item.name.slice(0, 120);
    const quantity = item.quantity.slice(0, 40);
    const guessed = suggestGroceryCategory(name);
    const category = !categories.has(item.category)
      ? guessed
      : item.category === "other" ||
          (item.category === "produce" && guessed !== "produce" && guessed !== "other")
        ? guessed
        : item.category;
    const price =
      item.estimated_price != null && item.estimated_price > 0
        ? Math.round(item.estimated_price)
        : estimateGroceryPrice(name, quantity, category);
    return {
      user_id: user.id,
      name,
      quantity,
      category,
      estimated_price: price,
    };
  });

  const { error } = await supabase.from("grocery_items").insert(rows);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/groceries");
  return { ok: true, message: `Added ${rows.length} item${rows.length === 1 ? "" : "s"} to your list.` };
}
