"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
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

  await writeAuditLog({
    action: "meal_logged",
    entity: "nutrition_logs",
    metadata: { meal_name: parsed.data.meal_name, meal_type: parsed.data.meal_type },
  });

  const { syncGoalProgress } = await import("@/lib/goals/progress");
  await syncGoalProgress(supabase, user.id);

  revalidatePath("/dashboard/nutrition");
  revalidatePath("/dashboard/settings/goals");
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

const waterSchema = z.object({
  amount_ml: z.coerce.number().int().min(50).max(2000),
});

/** One-tap water logging — no need to type ml. Adds to today's check-in total. */
export async function addWaterIntake(formData: FormData) {
  const parsed = waterSchema.safeParse({
    amount_ml: formData.get("amount_ml"),
  });
  if (!parsed.success) return { ok: false, message: "Pick a glass or bottle size." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("water_ml")
    .eq("user_id", user.id)
    .eq("checkin_date", today)
    .maybeSingle();

  const nextWater = Math.min(
    20000,
    Math.max(0, (existing?.water_ml ?? 0) + parsed.data.amount_ml),
  );

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: today,
      water_ml: nextWater,
    },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "water_logged",
    entity: "daily_checkins",
    metadata: { amount_ml: parsed.data.amount_ml, water_ml: nextWater },
  });

  const { syncGoalProgress } = await import("@/lib/goals/progress");
  await syncGoalProgress(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/nutrition");
  revalidatePath("/dashboard/nutrition/log");
  revalidatePath("/dashboard/hydration");
  return {
    ok: true,
    message:
      parsed.data.amount_ml >= 500
        ? `+${parsed.data.amount_ml} ml bottle logged.`
        : `+${parsed.data.amount_ml} ml glass logged.`,
  };
}
