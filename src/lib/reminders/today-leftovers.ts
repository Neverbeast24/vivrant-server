import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit";
import { quietSoftDelete } from "@/lib/archive";
import { hydrateGymPlan, summarizeTodaysProgram, type GymPlan } from "@/lib/gym";
import { leftoverReminderCopy } from "@/lib/reminders/today-leftovers-copy";
import { computeNextFireAt } from "@/lib/reminders/schedule";

export const TODAY_LEFTOVER_SOURCE = "today-leftovers";
export { leftoverReminderCopy };

export async function collectTodayLeftoverParts(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [
    habitsRes,
    habitLogsRes,
    checkinRes,
    profileRes,
    groceryRes,
    mealsRes,
    workoutsRes,
    gymRes,
    plansRes,
  ] = await Promise.all([
    supabase.from("habits").select("id").eq("user_id", userId).eq("active", true),
    supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("logged_on", today),
    supabase
      .from("daily_checkins")
      .select("water_ml")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("daily_water_goal_ml")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("grocery_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_checked", false),
    supabase
      .from("nutrition_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("logged_at", sinceIso),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("logged_at", sinceIso),
    supabase
      .from("gym_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("logged_at", sinceIso),
    supabase
      .from("gym_plans")
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const parts: string[] = [];
  const doneIds = new Set((habitLogsRes.data ?? []).map((row) => row.habit_id));
  const undone = (habitsRes.data ?? []).filter((habit) => !doneIds.has(habit.id)).length;
  if (undone > 0) parts.push(`${undone} habit${undone === 1 ? "" : "s"}`);

  const waterMl = Number(checkinRes.data?.water_ml ?? 0);
  const waterGoal = Number(profileRes.data?.daily_water_goal_ml ?? 2400);
  const waterLeft = Math.max(0, waterGoal - waterMl);
  if (waterLeft > 0) parts.push(`${waterLeft} ml of water`);

  const groceryOpen = groceryRes.count ?? 0;
  if (groceryOpen > 0) {
    parts.push(`${groceryOpen} grocery item${groceryOpen === 1 ? "" : "s"}`);
  }

  if ((mealsRes.count ?? 0) === 0) parts.push("no meal logged");

  const program = summarizeTodaysProgram(
    ((plansRes.data ?? []) as GymPlan[]).map((row) => hydrateGymPlan(row)),
  );
  const moved = (workoutsRes.count ?? 0) + (gymRes.count ?? 0);
  if (program?.today?.exercises?.length && moved === 0) {
    parts.push("today’s gym program");
  }

  return parts;
}

export async function syncTodayLeftoverReminders(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: boolean; message: string; reminder?: Record<string, unknown> | null }> {
  const [parts, settingsRes] = await Promise.all([
    collectTodayLeftoverParts(supabase, userId),
    supabase.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle(),
  ]);
  const copy = leftoverReminderCopy(parts);
  const timezone = settingsRes.data?.timezone || "Asia/Manila";

  const cleared = await quietSoftDelete(supabase, {
    table: "user_reminders",
    userId,
    match: { source_id: TODAY_LEFTOVER_SOURCE },
  });
  if (!cleared.ok) return { ok: false, message: cleared.message };

  if (!copy) {
    return { ok: true, message: "You’re caught up — nothing left to nudge." };
  }

  const schedule_time = "18:00";
  const days_of_week = [1, 2, 3, 4, 5, 6, 7];
  const next = computeNextFireAt({
    scheduleTime: schedule_time,
    daysOfWeek: days_of_week,
    timezone,
  });

  const { data: reminder, error } = await supabase
    .from("user_reminders")
    .insert({
      user_id: userId,
      title: copy.title,
      body: copy.body,
      kind: "custom",
      schedule_time,
      days_of_week,
      href: "/dashboard",
      source_id: TODAY_LEFTOVER_SOURCE,
      enabled: true,
      timezone,
      next_fire_at: next.toISOString(),
    })
    .select("*")
    .single();
  if (error) return { ok: false, message: error.message };

  await writeAuditLog(
    {
      action: "today_leftover_reminders_synced",
      entity: "user_reminders",
      metadata: { parts },
    },
    supabase,
  );

  return {
    ok: true,
    message: `Evening catch-up set for 6:00 PM (${parts.length} leftover${parts.length === 1 ? "" : "s"}).`,
    reminder: reminder ?? null,
  };
}
