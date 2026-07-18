"use server";

import { revalidatePath } from "next/cache";
import { buildUserContext } from "@/lib/ai/context";
import { suggestGoals } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

const categories = new Set([
  "nutrition",
  "movement",
  "sleep",
  "mindfulness",
  "spending",
  "other",
]);

export async function suggestGoalsWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const goals = await suggestGoals(context);
    return { ok: true, message: "Goal ideas ready.", goals };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not suggest goals.";
    return { ok: false, message };
  }
}

export async function acceptSuggestedGoal(goal: {
  title: string;
  category: string;
  target_value: number | null;
  unit: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("health_goals").insert({
    user_id: user.id,
    title: goal.title.slice(0, 120),
    category: categories.has(goal.category) ? goal.category : "other",
    target_value: goal.target_value,
    unit: goal.unit,
    status: "active",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Goal added." };
}
