export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const patchSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  birth_date: z.string().date().nullable().optional(),
  sex: z
    .enum(["female", "male", "non_binary", "prefer_not_to_say"])
    .nullable()
    .optional(),
  height_cm: z.coerce.number().min(50).max(250).nullable().optional(),
  weight_kg: z.coerce.number().min(20).max(400).nullable().optional(),
  goal_weight_kg: z.coerce.number().min(20).max(400).nullable().optional(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .nullable()
    .optional(),
  health_focus: z
    .enum(["general", "weight", "strength", "endurance", "nutrition", "sleep", "stress"])
    .nullable()
    .optional(),
  daily_step_goal: z.coerce.number().int().min(1000).max(100000).optional(),
  daily_water_goal_ml: z.coerce.number().int().min(250).max(10000).optional(),
  monthly_health_budget: z.coerce.number().min(0).max(10000000).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;

  return jsonOk({ profile: auth.profile });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const json = await readJson(request);
  if (json === null) return jsonError("Invalid JSON body.", 400);

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile fields.", 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return jsonError("Provide at least one field to update.", 400);
  }

  const { data: previous } = await supabase
    .from("profiles")
    .select("weight_kg, height_cm")
    .eq("user_id", user.id)
    .maybeSingle();

  const updates: Record<string, unknown> = { ...parsed.data };
  if ("bio" in updates) updates.bio = updates.bio || null;

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  const weightChanged =
    "weight_kg" in updates &&
    updates.weight_kg != null &&
    Number(previous?.weight_kg ?? NaN) !== Number(updates.weight_kg);
  const heightChanged =
    "height_cm" in updates &&
    updates.height_cm != null &&
    Number(previous?.height_cm ?? NaN) !== Number(updates.height_cm);

  if (weightChanged || heightChanged) {
    await supabase.from("health_history").insert({
      user_id: user.id,
      recorded_at: new Date().toISOString().slice(0, 10),
      weight_kg: updates.weight_kg ?? previous?.weight_kg ?? null,
      height_cm: updates.height_cm ?? previous?.height_cm ?? null,
      source: "profile_update",
      note: "Synced from health profile",
    });
  }

  await writeAuditLog(
    {
      action: "health_profile_updated",
      entity: "profiles",
      entityId: user.id,
      metadata: { fields: Object.keys(updates) },
    },
    supabase,
  );

  return jsonOk({ profile: updated });
}
