"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const mealSchema = z.object({
  meal_name: z.string().min(1).max(120),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.coerce.number().int().min(0).optional(),
  protein_g: z.coerce.number().min(0).optional(),
  carbs_g: z.coerce.number().min(0).optional(),
  fat_g: z.coerce.number().min(0).optional(),
});

export async function logMeal(formData: FormData) {
  const parsed = mealSchema.safeParse({
    meal_name: formData.get("meal_name"),
    meal_type: formData.get("meal_type"),
    calories: formData.get("calories") || undefined,
    protein_g: formData.get("protein_g") || undefined,
    carbs_g: formData.get("carbs_g") || undefined,
    fat_g: formData.get("fat_g") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Please fill in the meal details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("nutrition_logs").insert({
    user_id: user.id,
    ...parsed.data,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/nutrition");
  return { ok: true, message: "Meal logged." };
}

export async function deleteMeal(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/nutrition");
  return { ok: true, message: "Meal removed." };
}
