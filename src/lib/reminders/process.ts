import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notifications/notify";
import { computeNextFireAt } from "@/lib/reminders/schedule";

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
      return { ok: false as const, fired: 0, message: "Admin client unavailable." };
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

  if (!rows.length) return { ok: true as const, fired: 0 };

  let fired = 0;
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

    await notifyUsers({
      userIds: [row.user_id],
      title: row.title,
      body: row.body,
      href,
      sendPush: true,
      asUserClient: options?.userId ? writer : undefined,
    });

    const next = computeNextFireAt({
      scheduleTime: String(row.schedule_time).slice(0, 5),
      daysOfWeek: row.days_of_week?.length ? row.days_of_week : [1, 2, 3, 4, 5, 6, 7],
      timezone: row.timezone || "Asia/Manila",
      from: new Date(),
    });

    await writer
      .from("user_reminders")
      .update({
        last_sent_at: nowIso,
        next_fire_at: next.toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", row.user_id);

    fired += 1;
  }

  return { ok: true as const, fired };
}
