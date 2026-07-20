"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications_enabled: z.coerce.boolean(),
  weekly_report_enabled: z.coerce.boolean(),
  timezone: z.string().min(1),
});

export async function saveSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse({
    theme: formData.get("theme"),
    notifications_enabled: formData.get("notifications_enabled") === "on",
    weekly_report_enabled: formData.get("weekly_report_enabled") === "on",
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid settings." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/settings");
  await writeAuditLog({
    action: "settings_updated",
    entity: "user_settings",
    entityId: user.id,
  });
  return { ok: true, message: "Settings saved." };
}

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().min(min).max(max).nullable(),
  );

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  birth_date: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().date().nullable(),
  ),
  sex: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).nullable(),
  ),
  height_cm: optionalNumber(50, 250),
  weight_kg: optionalNumber(20, 400),
  goal_weight_kg: optionalNumber(20, 400),
  activity_level: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(["sedentary", "light", "moderate", "active", "very_active"]).nullable(),
  ),
  health_focus: z.preprocess(
    (value) => (value === "" ? null : value),
    z
      .enum(["general", "weight", "strength", "endurance", "nutrition", "sleep", "stress"])
      .nullable(),
  ),
  daily_step_goal: z.coerce.number().int().min(1000).max(100000),
  daily_water_goal_ml: z.coerce.number().int().min(250).max(10000),
  monthly_health_budget: z.coerce.number().min(0).max(10000000),
  bio: z.string().trim().max(500),
});

export async function saveHealthProfile(formData: FormData) {
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    birth_date: formData.get("birth_date"),
    sex: formData.get("sex"),
    height_cm: formData.get("height_cm"),
    weight_kg: formData.get("weight_kg"),
    goal_weight_kg: formData.get("goal_weight_kg"),
    activity_level: formData.get("activity_level"),
    health_focus: formData.get("health_focus"),
    daily_step_goal: formData.get("daily_step_goal"),
    daily_water_goal_ml: formData.get("daily_water_goal_ml"),
    monthly_health_budget: formData.get("monthly_health_budget"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: previous } = await supabase
    .from("profiles")
    .select("weight_kg, height_cm")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, bio: parsed.data.bio || null })
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  const weightChanged =
    parsed.data.weight_kg != null &&
    Number(previous?.weight_kg ?? NaN) !== Number(parsed.data.weight_kg);
  const heightChanged =
    parsed.data.height_cm != null &&
    Number(previous?.height_cm ?? NaN) !== Number(parsed.data.height_cm);

  if (weightChanged || heightChanged) {
    await supabase.from("health_history").insert({
      user_id: user.id,
      recorded_at: new Date().toISOString().slice(0, 10),
      weight_kg: parsed.data.weight_kg,
      height_cm: parsed.data.height_cm,
      source: "profile_update",
      note: "Synced from health profile",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/gym");
  await writeAuditLog({
    action: "health_profile_updated",
    entity: "profiles",
    entityId: user.id,
    metadata: {
      display_name: parsed.data.display_name,
      weight_synced: weightChanged || heightChanged,
    },
  });
  return { ok: true, message: "Health profile updated." };
}
