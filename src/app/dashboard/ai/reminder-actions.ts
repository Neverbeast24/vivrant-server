"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { draftReminder } from "@/lib/ai/gemini";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { processDueReminders } from "@/lib/reminders/process";
import { createClient } from "@/lib/supabase/server";

const kindEnum = z.enum([
  "gym",
  "plan",
  "hydration",
  "sleep",
  "habit",
  "mindfulness",
  "custom",
]);

const reminderSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  kind: kindEnum.default("custom"),
  schedule_time: z
    .string()
    .transform((v) => v.slice(0, 5))
    .pipe(z.string().regex(/^\d{2}:\d{2}$/)),
  days_of_week: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  href: z.string().trim().max(500).optional().nullable(),
  source_id: z.string().trim().max(80).optional().nullable(),
  enabled: z.boolean().default(true),
});

function parseDays(formData: FormData) {
  const raw = formData.getAll("days_of_week").map((v) => Number(v));
  if (raw.length) return raw.filter((n) => n >= 1 && n <= 7);
  const csv = String(formData.get("days_csv") ?? "");
  if (csv.trim()) {
    return csv
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => n >= 1 && n <= 7);
  }
  return [1, 2, 3, 4, 5, 6, 7];
}

function revalidateReminderPaths() {
  revalidatePath("/dashboard/ai/reminders");
  revalidatePath("/dashboard/ai");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gym");
}

export async function createReminder(formData: FormData) {
  const parsed = reminderSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    kind: formData.get("kind") || "custom",
    schedule_time: formData.get("schedule_time") || "09:00",
    days_of_week: parseDays(formData),
    href: formData.get("href") || null,
    source_id: formData.get("source_id") || null,
    enabled: formData.get("enabled") !== "off",
  });
  if (!parsed.success) return { ok: false, message: "Fill in reminder details." };

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
  const next = computeNextFireAt({
    scheduleTime: parsed.data.schedule_time,
    daysOfWeek: parsed.data.days_of_week,
    timezone,
  });

  const { error } = await supabase.from("user_reminders").insert({
    user_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    kind: parsed.data.kind,
    schedule_time: parsed.data.schedule_time,
    days_of_week: parsed.data.days_of_week,
    href: parsed.data.href,
    source_id: parsed.data.source_id,
    enabled: parsed.data.enabled,
    timezone,
    next_fire_at: next.toISOString(),
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "reminder_created",
    entity: "user_reminders",
    metadata: { title: parsed.data.title, kind: parsed.data.kind },
  });

  revalidateReminderPaths();
  return { ok: true, message: "Reminder scheduled." };
}

export async function toggleReminder(id: number, enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const patch: Record<string, unknown> = { enabled };
  if (enabled) {
    const { data: row } = await supabase
      .from("user_reminders")
      .select("schedule_time, days_of_week, timezone")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (row) {
      patch.next_fire_at = computeNextFireAt({
        scheduleTime: String(row.schedule_time).slice(0, 5),
        daysOfWeek: row.days_of_week ?? [1, 2, 3, 4, 5, 6, 7],
        timezone: row.timezone || "Asia/Manila",
      }).toISOString();
    }
  }

  const { error } = await supabase
    .from("user_reminders")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidateReminderPaths();
  return { ok: true, message: enabled ? "Reminder on." : "Reminder paused." };
}

export async function deleteReminder(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("user_reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidateReminderPaths();
  return { ok: true, message: "Reminder removed." };
}

export async function draftAndSaveReminder(_formData?: FormData) {
  void _formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const reminder = await draftReminder(context);
    const { data: settings } = await supabase
      .from("user_settings")
      .select("timezone")
      .eq("user_id", user.id)
      .maybeSingle();
    const timezone = settings?.timezone || "Asia/Manila";
    const schedule_time = "18:00";
    const days_of_week = [1, 2, 3, 4, 5, 6, 7];
    const next = computeNextFireAt({ scheduleTime: schedule_time, daysOfWeek: days_of_week, timezone });

    const { error } = await supabase.from("user_reminders").insert({
      user_id: user.id,
      title: reminder.title,
      body: reminder.body,
      kind: "custom",
      schedule_time,
      days_of_week,
      href: "/dashboard",
      enabled: true,
      timezone,
      next_fire_at: next.toISOString(),
    });
    if (error) return { ok: false, message: error.message };

    revalidateReminderPaths();
    return {
      ok: true,
      message: "AI reminder saved and scheduled for 6:00 PM daily.",
      reminder,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not draft a reminder.";
    return { ok: false, message };
  }
}

/** Create reminders from the member's latest active gym plan. */
export async function syncRemindersFromGymPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: plan } = await supabase
    .from("gym_plans")
    .select("id, title, days_per_week, days, focus")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return { ok: false, message: "No gym plan found. Generate one first." };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  const timezone = settings?.timezone || "Asia/Manila";

  // Prefer weekday pattern from days_per_week
  const daysPerWeek = Math.min(6, Math.max(2, Number(plan.days_per_week ?? 3)));
  const defaultDays =
    daysPerWeek >= 5
      ? [1, 2, 3, 4, 5]
      : daysPerWeek === 4
        ? [1, 2, 4, 5]
        : daysPerWeek === 3
          ? [1, 3, 5]
          : [2, 5];

  await supabase
    .from("user_reminders")
    .delete()
    .eq("user_id", user.id)
    .eq("kind", "plan")
    .eq("source_id", String(plan.id));

  const schedule_time = "07:30";
  const next = computeNextFireAt({
    scheduleTime: schedule_time,
    daysOfWeek: defaultDays,
    timezone,
  });

  const { error } = await supabase.from("user_reminders").insert({
    user_id: user.id,
    title: `Gym: ${plan.title}`.slice(0, 120),
    body: `Training day for your ${plan.focus || "gym"} plan. Lace up and log the session.`.slice(
      0,
      500,
    ),
    kind: "plan",
    schedule_time,
    days_of_week: defaultDays,
    href: "/dashboard/gym/sessions",
    source_id: String(plan.id),
    enabled: true,
    timezone,
    next_fire_at: next.toISOString(),
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "gym_plan_reminders_synced",
    entity: "user_reminders",
    metadata: { plan_id: plan.id, days: defaultDays },
  });

  revalidateReminderPaths();
  return {
    ok: true,
    message: `Gym plan reminders synced (${defaultDays.length} days/week at 7:30 AM).`,
  };
}

export async function runDueRemindersNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const result = await processDueReminders({ userId: user.id });
  revalidatePath("/dashboard");
  return {
    ok: result.ok,
    message: result.ok
      ? result.fired
        ? `Sent ${result.fired} due reminder${result.fired === 1 ? "" : "s"}.`
        : "No reminders due right now."
      : result.message ?? "Could not process reminders.",
  };
}
