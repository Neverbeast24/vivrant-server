import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notifications/notify";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { logger } from "@/lib/logger";

type ReminderRow = {
  id: number;
  user_id: string;
  title: string;
  body: string;
  kind: string;
  schedule_time: string;
  days_of_week: number[] | null;
  href: string | null;
  timezone: string | null;
  enabled: boolean;
};

/**
 * Fire due reminders for one user (session client) or all users (admin/cron).
 * Claims each row by advancing next_fire_at before notify to avoid duplicate sends
 * when concurrent cron workers overlap.
 */
export async function processDueReminders(options?: {
  userId?: string;
  limit?: number;
}) {
  const limit = options?.limit ?? 100;
  const nowIso = new Date().toISOString();

  let rows: ReminderRow[] = [];

  if (options?.userId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_reminders")
      .select(
        "id, user_id, title, body, kind, schedule_time, days_of_week, href, timezone, enabled",
      )
      .eq("user_id", options.userId)
      .eq("enabled", true)
      .lte("next_fire_at", nowIso)
      .order("next_fire_at", { ascending: true })
      .limit(limit);
    rows = (data as ReminderRow[] | null) ?? [];
  } else {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return { ok: false as const, fired: 0, skipped: 0, failed: 0, message: "Admin client unavailable." };
    }
    const { data } = await admin
      .from("user_reminders")
      .select(
        "id, user_id, title, body, kind, schedule_time, days_of_week, href, timezone, enabled",
      )
      .eq("enabled", true)
      .lte("next_fire_at", nowIso)
      .order("next_fire_at", { ascending: true })
      .limit(limit);
    rows = (data as ReminderRow[] | null) ?? [];
  }

  if (!rows.length) return { ok: true as const, fired: 0, skipped: 0, failed: 0 };

  let fired = 0;
  let skipped = 0;
  let failed = 0;
  const writer = options?.userId ? await createClient() : createAdminClient();

  for (const row of rows) {
    const href =
      row.href ??
      (row.kind === "gym" || row.kind === "plan"
        ? "/dashboard/gym"
        : row.kind === "hydration"
          ? "/dashboard/hydration"
          : row.kind === "sleep"
            ? "/dashboard/sleep"
            : row.kind === "habit"
              ? "/dashboard/habits"
              : row.kind === "mindfulness"
                ? "/dashboard/mindfulness"
                : "/dashboard/ai/reminders");

    const next = computeNextFireAt({
      scheduleTime: String(row.schedule_time).slice(0, 5),
      daysOfWeek: row.days_of_week?.length ? row.days_of_week : [1, 2, 3, 4, 5, 6, 7],
      timezone: row.timezone || "Asia/Manila",
      from: new Date(),
    });

    // Claim first: only one worker wins the update when next_fire_at is still due.
    const { data: claimed, error: claimError } = await writer
      .from("user_reminders")
      .update({
        last_sent_at: nowIso,
        next_fire_at: next.toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", row.user_id)
      .lte("next_fire_at", nowIso)
      .select("id")
      .maybeSingle();

    if (claimError || !claimed) {
      skipped += 1;
      continue;
    }

    try {
      await notifyUsers({
        userIds: [row.user_id],
        title: row.title,
        body: row.body,
        href,
        sendPush: true,
        asUserClient: options?.userId ? writer : undefined,
      });
      fired += 1;
    } catch (error) {
      failed += 1;
      logger.error("reminders/process", "Failed to deliver claimed reminder", {
        reminder_id: row.id,
        internal: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { ok: true as const, fired, skipped, failed };
}
