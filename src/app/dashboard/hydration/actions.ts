"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";
import { syncChallengeProgress } from "@/lib/challenges/progress";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { createClient } from "@/lib/supabase/server";

const waterSchema = z.object({
  amount_ml: z.coerce.number().int().min(50).max(2000),
});

export async function addHydration(formData: FormData) {
  const parsed = waterSchema.safeParse({ amount_ml: formData.get("amount_ml") });
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

  const nextWater = Math.min(20000, Math.max(0, (existing?.water_ml ?? 0) + parsed.data.amount_ml));

  const { error } = await supabase.from("daily_checkins").upsert(
    { user_id: user.id, checkin_date: today, water_ml: nextWater },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return { ok: false, message: error.message };

  await syncGoalProgress(supabase, user.id);
  await syncChallengeProgress(supabase, user.id);
  await writeAuditLog({
    action: "water_logged",
    entity: "daily_checkins",
    metadata: { amount_ml: parsed.data.amount_ml, water_ml: nextWater },
  });

  revalidatePath("/dashboard/hydration");
  revalidatePath("/dashboard/nutrition");
  revalidatePath("/dashboard");
  return { ok: true, message: `+${parsed.data.amount_ml} ml logged.` };
}

export async function scheduleHydrationReminders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  const timezone = settings?.timezone || "Asia/Manila";

  await supabase
    .from("user_reminders")
    .delete()
    .eq("user_id", user.id)
    .eq("kind", "hydration")
    .eq("source_id", "hydration-preset");

  const slots = [
    { time: "10:00", body: "Mid-morning sip — refill your bottle." },
    { time: "14:00", body: "Afternoon hydration check — one glass now." },
    { time: "17:00", body: "Early evening water before dinner." },
  ];

  const rows = slots.map((slot) => ({
    user_id: user.id,
    title: "Drink water",
    body: slot.body,
    kind: "hydration" as const,
    schedule_time: slot.time,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    href: "/dashboard/hydration",
    source_id: "hydration-preset",
    enabled: true,
    timezone,
    next_fire_at: computeNextFireAt({
      scheduleTime: slot.time,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      timezone,
    }).toISOString(),
  }));

  const { error } = await supabase.from("user_reminders").insert(rows);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/hydration");
  revalidatePath("/dashboard/ai/reminders");
  return { ok: true, message: "Hydration reminders set for 10:00, 14:00, and 17:00." };
}
