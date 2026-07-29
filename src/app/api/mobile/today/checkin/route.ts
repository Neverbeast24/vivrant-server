export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";
import { syncChallengeProgress } from "@/lib/challenges/progress";

const scale = (max: number) => z.coerce.number().int().min(1).max(max).nullable().optional();

const bodySchema = z.object({
  energy: scale(5),
  mood: scale(5),
  steps: z.coerce.number().int().min(0).nullable().optional(),
  water_ml: z.coerce.number().int().min(0).nullable().optional(),
  sleep_minutes: z.coerce.number().int().min(0).max(1440).nullable().optional(),
  sleep_quality: scale(5),
  bedtime: z.string().trim().min(1).max(8).nullable().optional(),
  wake_time: z.string().trim().min(1).max(8).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const json = await readJson(request);
  if (json === null) return jsonError("Invalid JSON body.", 400);

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid check-in.", 400);
  }

  const payload: Record<string, unknown> = { ...parsed.data };
  if ("note" in payload) payload.note = payload.note || null;

  const { data: checkin, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date: todayDate(),
        ...payload,
      },
      { onConflict: "user_id,checkin_date" },
    )
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  void Promise.all([
    syncGoalProgress(supabase, user.id),
    syncChallengeProgress(supabase, user.id),
  ]).catch(() => null);

  await writeAuditLog(
    {
      action: "checkin_saved",
      entity: "daily_checkins",
      entityId: String(checkin.id),
      metadata: payload,
    },
    supabase,
  );

  return jsonOk({ checkin });
}
