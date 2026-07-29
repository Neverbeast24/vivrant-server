import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { syncGoalProgress } from "@/lib/goals/progress";

export const runtime = "nodejs";

const moodSchema = z.object({
  mood: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) return jsonError("Pick a mood from 1-5.");

  const today = todayDate();
  const { data: checkin, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date: today,
        mood: parsed.data.mood,
        note: parsed.data.note ?? null,
      },
      { onConflict: "user_id,checkin_date" },
    )
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await syncGoalProgress(supabase, user.id);

  return jsonOk({ checkin });
}
