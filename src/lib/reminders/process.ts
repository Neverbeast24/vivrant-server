import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notifications/notify";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { logger } from "@/lib/logger";
import { safeAppPath } from "@/lib/security/safe-path";

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

function defaultHrefForKind(kind: string) {
  if (kind === "gym" || kind === "plan") return "/dashboard/gym";
  if (kind === "hydration") return "/dashboard/hydration";
  if (kind === "sleep") return "/dashboard/sleep";
  if (kind === "habit") return "/dashboard/habits";
  if (kind === "mindfulness") return "/dashboard/mindfulness";
  return "/dashboard/ai/reminders";
}

/**
 * Fire due reminders for one user (session client) or all users (admin/cron).
 * Claims each row by advancing next_fire_at before notify to avoid duplicate sends
 * when concurrent cron workers overlap.
 *
 * Pass `client` when calling from Bearer/mobile routes — cookie `createClient()`
 * has no session there.
 */
export async function processDueReminders(options?: {
  userId?: string;
  limit?: number;
  client?: SupabaseClient;
}) {
  const limit = options?.limit ?? 100;
  const nowIso = new Date().toISOString();

  let rows: ReminderRow[] = [];
  let writer: SupabaseClient;

  if (options?.userId) {
    writer = options.client ?? (await createClient());
    const { data } = await writer
      .from("user_reminders")
      .select(
        "id, user_id, title, body, kind, schedule_time, days_of_week, href, timezone, enabled",
      )
      .eq("user_id", options.userId)
      .eq("enabled", true)
      .is("deleted_at", null)
      .lte("next_fire_at", nowIso)
      .order("next_fire_at", { ascending: true })
      .limit(limit);
    rows = (data as ReminderRow[] | null) ?? [];
  } else {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return {
        ok: false as const,
        fired: 0,
        skipped: 0,
        failed: 0,
        message: "Admin client unavailable.",
      };
    }
    writer = admin;
    const { data } = await admin
      .from("user_reminders")
      .select(
        "id, user_id, title, body, kind, schedule_time, days_of_week, href, timezone, enabled",
      )
      .eq("enabled", true)
      .is("deleted_at", null)
      .lte("next_fire_at", nowIso)
      .order("next_fire_at", { ascending: true })
      .limit(limit);
    rows = (data as ReminderRow[] | null) ?? [];
  }

  if (!rows.length) return { ok: true as const, fired: 0, skipped: 0, failed: 0 };

  let fired = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const href = safeAppPath(row.href, defaultHrefForKind(row.kind));

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
      .eq("enabled", true)
      .is("deleted_at", null)
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
      // Re-queue soon so a transient notify failure does not skip this occurrence.
      const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await writer
        .from("user_reminders")
        .update({ next_fire_at: retryAt })
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      logger.error("reminders/process", "Failed to deliver claimed reminder", {
        reminder_id: row.id,
        internal: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { ok: true as const, fired, skipped, failed };
}
