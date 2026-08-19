import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";

export const runtime = "nodejs";

const workoutSchema = z.object({
  title: z.string().trim().min(1).max(120),
  activity_type: z.enum(["walk", "run", "strength", "cycle", "yoga", "other"]),
  duration_minutes: z.coerce.number().int().min(1),
  calories_burned: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id === null) return jsonError("Invalid workout id.");

  const body = await readJson(request);
  const parsed = workoutSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in the workout details.", 400);

  const { data, error } = await supabase
    .from("workout_logs")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ workout: data });
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
  if (id === null) return jsonError("Invalid workout id.");

  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk();
}
