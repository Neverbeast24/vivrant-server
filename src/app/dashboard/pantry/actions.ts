"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const pantrySchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(40),
  stock_level: z.coerce.number().int().min(0).max(100),
});

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

  revalidatePath("/dashboard/pantry");
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
  revalidatePath("/dashboard/pantry");
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
  revalidatePath("/dashboard/pantry");
  return { ok: true, message: "Pantry item removed." };
}
