"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateSleepCoach } from "@/lib/ai/gemini";
import { syncGoalProgress } from "@/lib/goals/progress";
import { createClient } from "@/lib/supabase/server";

const sleepSchema = z.object({
  checkin_date: z.string().date(),
  sleep_hours: z.coerce.number().min(0).max(24),
  sleep_quality: z.coerce.number().int().min(1).max(5).optional().nullable(),
  bedtime: z.string().optional().nullable(),
  wake_time: z.string().optional().nullable(),
});

export async function logSleep(formData: FormData) {
  const parsed = sleepSchema.safeParse({
    checkin_date: formData.get("checkin_date") || new Date().toISOString().slice(0, 10),
    sleep_hours: formData.get("sleep_hours"),
    sleep_quality: formData.get("sleep_quality") || null,
    bedtime: formData.get("bedtime") || null,
    wake_time: formData.get("wake_time") || null,
  });
  if (!parsed.success) return { ok: false, message: "Enter a valid sleep amount." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const sleep_minutes = Math.round(parsed.data.sleep_hours * 60);
  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: parsed.data.checkin_date,
      sleep_minutes,
      sleep_quality: parsed.data.sleep_quality,
      bedtime: parsed.data.bedtime || null,
      wake_time: parsed.data.wake_time || null,
    },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return { ok: false, message: error.message };

  await syncGoalProgress(supabase, user.id);
  await writeAuditLog({
    action: "sleep_logged",
    entity: "daily_checkins",
    metadata: { sleep_minutes, date: parsed.data.checkin_date },
  });

  revalidatePath("/dashboard/sleep");
  revalidatePath("/dashboard");
  return { ok: true, message: "Sleep logged." };
}

export async function coachSleep() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const tip = await generateSleepCoach(context);
    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: tip.title,
      body: tip.body,
      score: tip.score,
      source: "sleep_coach",
    });
    revalidatePath("/dashboard/sleep");
    return { ok: true, message: "Sleep coach tip ready.", tip };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not coach sleep.",
    };
  }
}
