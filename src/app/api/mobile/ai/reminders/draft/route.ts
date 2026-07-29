export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { draftReminder } from "@/lib/ai/gemini";
import { computeNextFireAt } from "@/lib/reminders/schedule";

/** Draft an AI reminder and save it, scheduled for 6:00 PM daily. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const draft = await draftReminder(context);

    const { data: settings } = await supabase
      .from("user_settings")
      .select("timezone")
      .eq("user_id", user.id)
      .maybeSingle();
    const timezone = settings?.timezone || "Asia/Manila";
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
        user_id: user.id,
        title: draft.title,
        body: draft.body,
        kind: "custom",
        schedule_time,
        days_of_week,
        href: "/dashboard",
        enabled: true,
        timezone,
        next_fire_at: next.toISOString(),
      })
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);

    await writeAuditLog(
      {
        action: "reminder_drafted",
        entity: "user_reminders",
        entityId: reminder?.id != null ? String(reminder.id) : undefined,
        metadata: { title: draft.title },
      },
      supabase,
    );

    return jsonOk({ reminder, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not draft a reminder.";
    return jsonError(message, 500);
  }
}
