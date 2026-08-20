export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { archiveRecord } from "@/lib/archive";
import { writeAuditLog } from "@/lib/audit";
import { computeNextFireAt } from "@/lib/reminders/schedule";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  body: z.string().trim().min(1).max(500).optional(),
  kind: z.enum(["gym", "plan", "hydration", "sleep", "habit", "mindfulness", "custom"]).optional(),
  schedule_time: z
    .string()
    .transform((v) => v.slice(0, 5))
    .pipe(z.string().regex(/^\d{2}:\d{2}$/))
    .optional(),
  days_of_week: z.array(z.number().int().min(1).max(7)).min(1).max(7).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Nothing to update." },
);

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
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Nothing to update.", 400);

  const { data: row } = await supabase
    .from("user_reminders")
    .select("schedule_time, days_of_week, timezone, enabled")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return jsonError("Reminder not found.", 404);

  const patch: Record<string, unknown> = { ...parsed.data };
  const scheduleTime = String(parsed.data.schedule_time ?? row.schedule_time).slice(0, 5);
  const daysOfWeek = parsed.data.days_of_week ?? row.days_of_week ?? [1, 2, 3, 4, 5, 6, 7];
  const enabled = parsed.data.enabled ?? row.enabled;
  if (enabled) {
    patch.next_fire_at = computeNextFireAt({
      scheduleTime,
      daysOfWeek,
      timezone: row.timezone || "Asia/Manila",
    }).toISOString();
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
      action: "reminder_updated",
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

  const result = await archiveRecord(supabase, {
    table: "user_reminders",
    id,
    userId: user.id,
    auditAction: "reminder_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
