import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson, todayDate } from "@/lib/mobile/http";
import { syncChallengeProgress } from "@/lib/challenges/progress";
import { syncGoalProgress } from "@/lib/goals/progress";

export const runtime = "nodejs";

const toggleSchema = z.object({
  done: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const habitId = parseIdParam(rawId);
  if (habitId === null) return jsonError("Invalid habit id.");

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return jsonError("Provide done as a boolean.");

  const today = todayDate();

  if (parsed.data.done) {
    const { error } = await supabase.from("habit_logs").upsert(
      { habit_id: habitId, user_id: user.id, logged_on: today },
      { onConflict: "habit_id,logged_on" },
    );
    if (error) return jsonError(error.message, 500);
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("logged_on", today);
    if (error) return jsonError(error.message, 500);
  }

  // Don't block the mobile toggle on progress sync — UI needs a fast ack.
  void Promise.all([
    syncGoalProgress(supabase, user.id),
    syncChallengeProgress(supabase, user.id),
  ]).catch(() => null);

  return jsonOk({ done: parsed.data.done });
}
