"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { estimateGroceryPrice } from "@/lib/groceries/ph-price-catalog";
import { createClient } from "@/lib/supabase/server";
import { pantryToGroceryCategory } from "@/app/dashboard/pantry/shared";

const pantrySchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(40),
  stock_level: z.coerce.number().int().min(0).max(100),
});

function revalidatePantry() {
  revalidatePath("/dashboard/pantry");
  revalidatePath("/dashboard/pantry/items");
  revalidatePath("/dashboard/pantry/categories");
  revalidatePath("/dashboard/pantry/low-stock");
  revalidatePath("/dashboard/pantry/add");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/groceries");
  revalidatePath("/dashboard");
}

export async function addPantryItem(formData: FormData) {
  const parsed = pantrySchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    stock_level: formData.get("stock_level"),
  });
  if (!parsed.success) return { ok: false, message: "Please fill in pantry details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    ...parsed.data,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePantry();
  return { ok: true, message: "Pantry item added." };
}

export async function updatePantryStock(id: number, stockLevel: number) {
  const parsed = z.number().int().min(0).max(100).safeParse(stockLevel);
  if (!parsed.success) return { ok: false, message: "Stock must be between 0 and 100." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("pantry_items")
    .update({ stock_level: parsed.data })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePantry();
  return { ok: true, message: "Stock level updated." };
}

export async function deletePantryItem(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePantry();
  return { ok: true, message: "Pantry item removed." };
}

/** Push low-stock pantry items onto the grocery list. */
export async function addLowStockToGroceryList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: low } = await supabase
    .from("pantry_items")
    .select("name, category")
    .eq("user_id", user.id)
    .lte("stock_level", 25);

  if (!low?.length) return { ok: false, message: "Nothing is low stock right now." };

  const { data: open } = await supabase
    .from("grocery_items")
    .select("name")
    .eq("user_id", user.id)
    .eq("is_checked", false);

  const openNames = new Set(
    (open ?? []).map((r) => r.name.trim().toLowerCase()),
  );

  const toAdd = low.filter((item) => !openNames.has(item.name.trim().toLowerCase()));
  if (!toAdd.length) {
    return { ok: true, message: "Low-stock items are already on your list." };
  }

  const { error } = await supabase.from("grocery_items").insert(
    toAdd.map((item) => {
      const category = pantryToGroceryCategory(item.category || "other");
      return {
        user_id: user.id,
        name: item.name,
        category,
        quantity: "1",
        is_checked: false,
        estimated_price: estimateGroceryPrice(item.name, "1", category),
      };
    }),
  );
  if (error) return { ok: false, message: error.message };

  revalidatePantry();
  return {
    ok: true,
    message: `Added ${toAdd.length} low-stock item${toAdd.length === 1 ? "" : "s"} to groceries.`,
  };
}

/** Push one pantry item onto the grocery list. */
export async function addPantryItemToGroceryList(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: item } = await supabase
    .from("pantry_items")
    .select("id, name, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return { ok: false, message: "Pantry item not found." };

  const { data: open } = await supabase
    .from("grocery_items")
    .select("name")
    .eq("user_id", user.id)
    .eq("is_checked", false)
    .ilike("name", item.name.trim());

  if (open?.length) {
    return { ok: true, message: `${item.name} is already on your shopping list.` };
  }

  const category = pantryToGroceryCategory(item.category || "other");
  const { error } = await supabase.from("grocery_items").insert({
    user_id: user.id,
    name: item.name,
    category,
    quantity: "1",
    is_checked: false,
    estimated_price: estimateGroceryPrice(item.name, "1", category),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePantry();
  return { ok: true, message: `Added ${item.name} to groceries.` };
}
