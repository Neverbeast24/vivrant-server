"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  return { ok: true, message: "Settings saved." };
}
