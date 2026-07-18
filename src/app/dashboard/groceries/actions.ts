"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().max(40).optional(),
  category: z
    .enum(["produce", "protein", "dairy", "grains", "pantry", "snacks", "drinks", "household", "other"])
    .default("other"),
});

export async function addGroceryItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || undefined,
    category: formData.get("category") || "other",
  });
  if (!parsed.success) return { ok: false, message: "Enter an item name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("grocery_items").insert({
    user_id: user.id,
    name: parsed.data.name,
    quantity: parsed.data.quantity ?? null,
    category: parsed.data.category,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/groceries");
  return { ok: true, message: "Item added." };
}

export async function toggleGroceryItem(id: number, checked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("grocery_items")
    .update({ is_checked: checked })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/groceries");
  return { ok: true, message: "Updated." };
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
