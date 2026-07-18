"use server";

import { revalidatePath } from "next/cache";
import { generateHealthInsight } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

function dayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weekStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

async function buildUserContext(userId: string) {
  const supabase = await createClient();
  const since = dayStartIso();
  const weekStart = weekStartDate();

  const [profile, checkins, meals, workouts, expenses, pantry, groceries] = await Promise.all([
    supabase
      .from("profiles")
      .select("birth_date, sex, height_cm, weight_kg, goal_weight_kg, activity_level, health_focus, daily_step_goal, daily_water_goal_ml, monthly_health_budget, bio")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("checkin_date, energy, mood, steps, water_ml, sleep_minutes, note")
      .eq("user_id", userId)
      .gte("checkin_date", weekStart)
      .order("checkin_date", { ascending: false }),
    supabase
      .from("nutrition_logs")
      .select("meal_name, meal_type, calories, protein_g, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(12),
    supabase
      .from("workout_logs")
      .select("title, activity_type, duration_minutes, calories_burned, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(12),
    supabase
      .from("expenses")
      .select("title, category, amount, spent_at")
      .eq("user_id", userId)
      .order("spent_at", { ascending: false })
      .limit(12),
    supabase
      .from("pantry_items")
      .select("name, category, stock_level")
      .eq("user_id", userId)
      .order("stock_level", { ascending: true })
      .limit(12),
    supabase
      .from("grocery_items")
      .select("name, quantity, is_checked")
      .eq("user_id", userId)
      .eq("is_checked", false)
      .limit(12),
  ]);

  return JSON.stringify(
    {
      today: new Date().toISOString().slice(0, 10),
      timezone: "Asia/Manila",
      health_profile: profile.data ?? null,
      checkins_last_7_days: checkins.data ?? [],
      meals_today: meals.data ?? [],
      workouts_today: workouts.data ?? [],
      recent_expenses: expenses.data ?? [],
      low_pantry_items: pantry.data ?? [],
      open_grocery_list: groceries.data ?? [],
    },
    null,
    2,
  );
}

export async function generateInsight(_formData: FormData) {
  void _formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  if (!process.env.GEMINI_API_KEY) {
    return {
      ok: false,
      message: "Gemini is not configured. Add GEMINI_API_KEY to your server environment.",
    };
  }

  try {
    const context = await buildUserContext(user.id);
    const insight = await generateHealthInsight(context);

    const { error } = await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: insight.title,
      body: insight.body,
      score: insight.score,
    });
    if (error) return { ok: false, message: error.message };

    revalidatePath("/dashboard/ai");
    revalidatePath("/dashboard");
    return { ok: true, message: "New Gemini insight generated." };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini could not generate an insight.";
    return { ok: false, message };
  }
}
