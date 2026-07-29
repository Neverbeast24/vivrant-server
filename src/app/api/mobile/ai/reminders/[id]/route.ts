export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { computeNextFireAt } from "@/lib/reminders/schedule";

const patchSchema = z.object({ enabled: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid reminder id.", 400);

  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Provide enabled (boolean).", 400);

  const patch: Record<string, unknown> = { enabled: parsed.data.enabled };
  if (parsed.data.enabled) {
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

  const { data, error } = await supabase
    .from("user_reminders")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: parsed.data.enabled ? "reminder_enabled" : "reminder_disabled",
      entity: "user_reminders",
      entityId: String(id),
    },
    supabase,
  );

  return jsonOk({ reminder: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id == null) return jsonError("Invalid reminder id.", 400);

  const { error } = await supabase
    .from("user_reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "reminder_deleted", entity: "user_reminders", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
