export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { processDueReminders } from "@/lib/reminders/process";
import { safeAppPath } from "@/lib/security/safe-path";
import { applyIdOrder, fetchListOrder } from "@/lib/reorder";

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
    .transform((value) => value.slice(0, 5))
    .pipe(z.string().regex(/^\d{2}:\d{2}$/)),
  days_of_week: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  href: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => {
      if (value == null || value === "") return null;
      const safe = safeAppPath(value, "");
      return safe || null;
    }),
  source_id: z.string().trim().max(80).optional().nullable(),
  enabled: z.boolean().default(true),
});

/** List the member's scheduled reminders. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  // Process due reminders for this member (daily cron alone is too coarse).
  await processDueReminders({ userId: user.id, client: supabase, limit: 20 });

  const [{ data, error }, listOrder] = await Promise.all([
    supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("next_fire_at", { ascending: true }),
    fetchListOrder(supabase, user.id),
  ]);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ reminders: applyIdOrder(data ?? [], listOrder.reminders) });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = reminderSchema.safeParse(body);
  if (!parsed.success) return jsonError("Fill in reminder details.", 400);

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

  const { data, error } = await supabase
    .from("user_reminders")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      kind: parsed.data.kind,
      schedule_time: parsed.data.schedule_time,
      days_of_week: parsed.data.days_of_week,
      href: parsed.data.href ?? null,
      source_id: parsed.data.source_id ?? null,
      enabled: parsed.data.enabled,
      timezone,
      next_fire_at: next.toISOString(),
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "reminder_created",
      entity: "user_reminders",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: parsed.data.title, kind: parsed.data.kind },
    },
    supabase,
  );

  return jsonOk({ reminder: data }, 201);
}
