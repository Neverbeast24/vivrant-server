"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type CheckinState = { ok: boolean; message: string } | null;

function toIntOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export async function saveCheckin(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Your session expired. Please sign in again." };
  }

  const energy = toIntOrNull(formData, "energy");
  const mood = toIntOrNull(formData, "mood");
  const steps = toIntOrNull(formData, "steps");
  const water = toIntOrNull(formData, "water_ml");
  const sleepHours = toIntOrNull(formData, "sleep_hours");
  const sleepMinutes =
    sleepHours == null ? null : Math.min(1440, Math.max(0, sleepHours * 60));
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: new Date().toISOString().slice(0, 10),
      energy,
      mood,
      steps,
      water_ml: water,
      sleep_minutes: sleepMinutes,
      note,
    },
    { onConflict: "user_id,checkin_date" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  await writeAuditLog({
    action: "checkin_saved",
    entity: "daily_checkins",
    metadata: { energy, mood, steps, water_ml: water },
  });

  const { syncGoalProgress } = await import("@/lib/goals/progress");
  const { syncChallengeProgress } = await import("@/lib/challenges/progress");
  await syncGoalProgress(supabase, user.id);
  await syncChallengeProgress(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sleep");
  revalidatePath("/dashboard/hydration");
  revalidatePath("/dashboard/mindfulness");
  revalidatePath("/dashboard/habits/challenges");
  return { ok: true, message: "Check-in saved. Nice work today." };
}
