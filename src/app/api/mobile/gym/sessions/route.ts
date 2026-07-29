import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const exerciseItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sets: z.string().trim().max(60).default("as logged"),
});

const sessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  focus: z.enum(["full_body", "strength", "fat_loss", "mobility", "endurance", "upper", "lower", "core"]),
  duration_minutes: z.coerce.number().int().min(5).max(180),
  calories_burned: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(400).optional(),
  exercises: z.union([z.string().trim().max(2000), z.array(exerciseItemSchema)]).optional(),
});

/** List sessions (limit 50). */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("gym_sessions")
    .select("id, title, focus, duration_minutes, calories_burned, exercises, notes, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(50);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ sessions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Fill in a valid gym session.", 400);

  const exercisesInput = parsed.data.exercises;
  const exerciseRows = Array.isArray(exercisesInput)
    ? exercisesInput
    : (exercisesInput ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ name: line, sets: "as logged" }));

  const { data, error } = await supabase
    .from("gym_sessions")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      focus: parsed.data.focus,
      duration_minutes: parsed.data.duration_minutes,
      calories_burned: parsed.data.calories_burned ?? 0,
      notes: parsed.data.notes || null,
      exercises: exerciseRows,
    })
    .select("id, title, focus, duration_minutes, calories_burned, exercises, notes, logged_at")
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "gym_session_created",
      entity: "gym_sessions",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: parsed.data.title, focus: parsed.data.focus },
    },
    supabase,
  );

  return jsonOk({ session: data }, 201);
}
