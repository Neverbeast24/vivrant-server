"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

const goalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["nutrition", "movement", "sleep", "mindfulness", "spending", "other"]),
  target_value: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().trim().max(40).optional().nullable(),
  target_date: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().date().nullable(),
  ),
});

export async function addHealthGoal(formData: FormData) {
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    target_value: formData.get("target_value") || null,
    unit: formData.get("unit") || null,
    target_date: formData.get("target_date"),
  });
  if (!parsed.success) return { ok: false, message: "Please fill in a valid goal." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("health_goals").insert({
    user_id: user.id,
    title: parsed.data.title,
    category: parsed.data.category,
    target_value: parsed.data.target_value,
    unit: parsed.data.unit,
    target_date: parsed.data.target_date,
    status: "active",
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "goal_created",
    entity: "health_goals",
    metadata: { title: parsed.data.title, category: parsed.data.category },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Goal added." };
}

export async function updateGoalStatus(id: number, status: "active" | "completed" | "paused") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("health_goals")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: `Goal marked ${status}.` };
}

export async function updateGoalProgress(id: number, currentValue: number) {
  const parsed = z.number().min(0).max(1_000_000).safeParse(currentValue);
  if (!parsed.success) return { ok: false, message: "Enter a valid progress value." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("health_goals")
    .update({ current_value: parsed.data })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/goals");
  return { ok: true, message: "Progress updated." };
}

export async function refreshGoalProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { syncGoalProgress } = await import("@/lib/goals/progress");
  const result = await syncGoalProgress(supabase, user.id);
  revalidatePath("/dashboard/settings/goals");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: result.updated
      ? `Synced ${result.updated} goal${result.updated === 1 ? "" : "s"} from your logs.`
      : "Goals already match your latest logs.",
  };
}

export async function deleteHealthGoal(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("health_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Goal removed." };
}
