import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";

export const runtime = "nodejs";

const sleepSchema = z.object({
  sleep_minutes: z.coerce.number().int().min(0).max(1440).optional(),
  sleep_hours: z.coerce.number().min(0).max(24).optional(),
  sleep_quality: z.coerce.number().int().min(1).max(5).optional().nullable(),
  bedtime: z.string().trim().min(1).optional().nullable(),
  wake_time: z.string().trim().min(1).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  checkin_date: z.string().date().optional(),
});

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = sleepSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Provide sleep_minutes or sleep_hours.");
  }

  const { sleep_minutes, sleep_hours, sleep_quality, bedtime, wake_time, note, checkin_date } =
    parsed.data;

  const minutes =
    sleep_minutes != null ? sleep_minutes : sleep_hours != null ? Math.round(sleep_hours * 60) : null;
  if (minutes == null) return jsonError("Provide sleep_minutes or sleep_hours.");

  const date = checkin_date ?? todayDate();

  const { data: checkin, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date: date,
        sleep_minutes: minutes,
        sleep_quality: sleep_quality ?? null,
        bedtime: bedtime || null,
        wake_time: wake_time || null,
        ...(note !== undefined ? { note } : {}),
      },
      { onConflict: "user_id,checkin_date" },
    )
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await syncGoalProgress(supabase, user.id);
  await writeAuditLog(
    {
      action: "sleep_logged",
      entity: "daily_checkins",
      entityId: String(checkin.id),
      metadata: { sleep_minutes: minutes, date },
    },
    supabase,
  );

  return jsonOk({ checkin });
}
