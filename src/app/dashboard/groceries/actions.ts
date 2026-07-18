"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().max(40).optional(),
});

export async function addGroceryItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || undefined,
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
