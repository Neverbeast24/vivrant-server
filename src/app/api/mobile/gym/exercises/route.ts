import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { gymExerciseCardImage } from "@/lib/gym";

export const runtime = "nodejs";

/** GET ?equipment= — list gym_exercises ordered by name, optional equipment filter. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const equipment = searchParams.get("equipment");

  let query = supabase
    .from("gym_exercises")
    .select(
      "id, slug, name, muscle_group, equipment, difficulty, duration_seconds, demo_video_url, demo_thumbnail_url, cues",
    )
    .order("name");

  if (equipment) {
    query = query.eq("equipment", equipment);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  const origin = new URL(request.url).origin;
  const exercises = (data ?? []).map((exercise) => ({
    ...exercise,
    demo_thumbnail_url: gymExerciseCardImage(exercise, origin),
  }));

  return jsonOk({ exercises });
}
