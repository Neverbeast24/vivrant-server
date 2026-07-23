"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  estimateGroceryPrice,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().max(40).optional(),
  category: z
    .enum(["produce", "protein", "dairy", "grains", "pantry", "snacks", "drinks", "household", "other"])
    .default("other"),
  estimated_price: z.coerce.number().min(0).max(50000).optional(),
});

export async function addGroceryItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || undefined,
    category: formData.get("category") || "other",
    estimated_price: formData.get("estimated_price") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Enter an item name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  // Prefer name-based category when the form still says produce/other (common mis-picks).
  const guessed = suggestGroceryCategory(parsed.data.name);
  const category =
    parsed.data.category === "other" ||
    (parsed.data.category === "produce" && guessed !== "produce" && guessed !== "other")
      ? guessed
      : parsed.data.category;

  const estimatedPrice =
    parsed.data.estimated_price != null && !Number.isNaN(parsed.data.estimated_price)
      ? Math.round(parsed.data.estimated_price)
      : estimateGroceryPrice(parsed.data.name, parsed.data.quantity, category);

  const { error } = await supabase.from("grocery_items").insert({
    user_id: user.id,
    name: parsed.data.name,
    quantity: parsed.data.quantity ?? null,
    category,
    estimated_price: estimatedPrice,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/groceries");
  return { ok: true, message: `Item added · ${category} · ₱${estimatedPrice}.` };
}

async function restockPantryFromGrocery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  item: { name: string; category: string | null },
) {
  const name = item.name.trim();
  if (!name) return;
  const { data: existing } = await supabase
    .from("pantry_items")
    .select("id, stock_level")
    .eq("user_id", userId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("pantry_items")
      .update({ stock_level: Math.min(100, Math.max(existing.stock_level ?? 0, 80)) })
      .eq("id", existing.id)
      .eq("user_id", userId);
  } else {
    await supabase.from("pantry_items").insert({
      user_id: userId,
      name,
      category: item.category || "other",
      stock_level: 80,
    });
  }
}

export async function toggleGroceryItem(id: number, checked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: item } = await supabase
    .from("grocery_items")
    .select("id, name, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("grocery_items")
    .update({ is_checked: checked })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  if (checked && item) {
    await restockPantryFromGrocery(supabase, user.id, item);
    revalidatePath("/dashboard/pantry");
  }

  revalidatePath("/dashboard/groceries");
  return {
    ok: true,
    message: checked ? "Checked · pantry restocked." : "Updated.",
  };
}

/** Restock pantry from all currently checked grocery items. */
export async function restockPantryFromChecked() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: items } = await supabase
    .from("grocery_items")
    .select("name, category")
    .eq("user_id", user.id)
    .eq("is_checked", true);

  if (!items?.length) return { ok: false, message: "No checked items to restock." };

  for (const item of items) {
    await restockPantryFromGrocery(supabase, user.id, item);
  }

  revalidatePath("/dashboard/pantry");
  revalidatePath("/dashboard/groceries");
  return {
    ok: true,
    message: `Restocked ${items.length} pantry item${items.length === 1 ? "" : "s"}.`,
  };
}

export async function deleteGroceryItem(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/groceries");
  return { ok: true, message: "Item removed." };
}

export async function clearCompletedGroceries() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("user_id", user.id)
    .eq("is_checked", true);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/groceries");
  return { ok: true, message: "Completed items cleared." };
}
