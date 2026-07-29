import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { dayStartIso, jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";
import { syncChallengeProgress } from "@/lib/challenges/progress";

export const runtime = "nodejs";

const workoutSchema = z.object({
  title: z.string().trim().min(1).max(120),
  activity_type: z.enum(["walk", "run", "strength", "cycle", "yoga", "other"]),
  duration_minutes: z.coerce.number().int().min(1),
  calories_burned: z.coerce.number().int().min(0).optional(),
});

function dayRange(dateParam: string | null) {
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayDate();
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: dayStartIso(start), endIso: dayStartIso(end) };
}

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const { startIso, endIso } = dayRange(searchParams.get("date"));

  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", startIso)
    .lt("logged_at", endIso)
    .order("logged_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ workouts: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = workoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Provide title, activity_type, and duration_minutes.");
  }

  const { data: workout, error } = await supabase
    .from("workout_logs")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "workout_logged",
      entity: "workout_logs",
      entityId: String(workout.id),
      metadata: { title: parsed.data.title, activity_type: parsed.data.activity_type },
    },
    supabase,
  );
  void Promise.all([
    syncGoalProgress(supabase, user.id),
    syncChallengeProgress(supabase, user.id),
  ]).catch(() => null);

  return jsonOk({ workout });
}
