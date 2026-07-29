export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().min(min).max(max).nullable(),
  );

const historySchema = z.object({
  recorded_at: z.string().date().optional(),
  weight_kg: optionalNumber(20, 400),
  height_cm: optionalNumber(50, 250),
  body_fat_pct: optionalNumber(3, 70),
  waist_cm: optionalNumber(40, 200),
  note: z.string().trim().max(300).optional().nullable(),
});

/** List the member's health history entries, newest first. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("health_history")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = historySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a valid history entry with at least one measurement.", 400);
  }
  if (
    parsed.data.weight_kg == null &&
    parsed.data.height_cm == null &&
    parsed.data.body_fat_pct == null &&
    parsed.data.waist_cm == null
  ) {
    return jsonError("Add weight, height, body fat, or waist.", 400);
  }

  const { data: entry, error } = await supabase
    .from("health_history")
    .insert({
      user_id: user.id,
      recorded_at: parsed.data.recorded_at ?? todayDate(),
      weight_kg: parsed.data.weight_kg,
      height_cm: parsed.data.height_cm,
      body_fat_pct: parsed.data.body_fat_pct,
      waist_cm: parsed.data.waist_cm,
      note: parsed.data.note || null,
      source: "manual",
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  // Keep profile in sync when latest weight/height is logged.
  const profilePatch: Record<string, number> = {};
  if (parsed.data.weight_kg != null) profilePatch.weight_kg = parsed.data.weight_kg;
  if (parsed.data.height_cm != null) profilePatch.height_cm = parsed.data.height_cm;
  if (Object.keys(profilePatch).length) {
    await supabase.from("profiles").update(profilePatch).eq("user_id", user.id);
  }

  await writeAuditLog(
    {
      action: "health_history_created",
      entity: "health_history",
      entityId: entry?.id != null ? String(entry.id) : undefined,
      metadata: {
        recorded_at: parsed.data.recorded_at,
        weight_kg: parsed.data.weight_kg,
        height_cm: parsed.data.height_cm,
      },
    },
    supabase,
  );

  return jsonOk({ entry }, 201);
}
