import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";

export const runtime = "nodejs";

const waterSchema = z
  .object({
    ml: z.coerce.number().int().min(50).max(2000).optional(),
    amount_ml: z.coerce.number().int().min(50).max(2000).optional(),
  })
  .refine((data) => data.ml != null || data.amount_ml != null, {
    message: "Provide ml (50-2000).",
  });

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = waterSchema.safeParse(body);
  if (!parsed.success) return jsonError("Provide ml (50-2000).");

  const amountMl = (parsed.data.ml ?? parsed.data.amount_ml) as number;
  const today = todayDate();

  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("water_ml")
    .eq("user_id", user.id)
    .eq("checkin_date", today)
    .maybeSingle();

  const water_ml = Math.min(20000, Math.max(0, (existing?.water_ml ?? 0) + amountMl));

  const { error } = await supabase.from("daily_checkins").upsert(
    { user_id: user.id, checkin_date: today, water_ml },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "water_logged",
      entity: "daily_checkins",
      metadata: { amount_ml: amountMl, water_ml },
    },
    supabase,
  );
  await syncGoalProgress(supabase, user.id);

  return jsonOk({ water_ml });
}
