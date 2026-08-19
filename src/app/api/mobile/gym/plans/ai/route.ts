import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { clampGymPlanPrefs } from "@/lib/health/body-metrics";
import { remainingTrainingDays } from "@/lib/gym-program-draft";
import { previewGymProgram } from "@/lib/gym-plan-generate";

export const runtime = "nodejs";

/** Generate AI workouts into a program draft — does not save the weekly program until the member keeps days and commits. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  let body: {
    days_per_week?: number;
    training_days?: number[];
    session_minutes?: number;
    level?: string;
    known_machine_slugs?: string[];
    known_custom_exercises?: string[];
    avoid_targets?: string[];
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const prefs = clampGymPlanPrefs(body);

  try {
    const draft = await previewGymProgram(supabase, user.id, prefs);
    const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
    return jsonOk({
      draft,
      remaining_days: remaining,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create a gym program.";
    return jsonError(message, 500);
  }
}
