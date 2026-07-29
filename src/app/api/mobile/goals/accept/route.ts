export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const acceptSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["nutrition", "movement", "sleep", "mindfulness", "spending", "other"]),
  target_value: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().trim().max(40).optional().nullable(),
  target_date: z
    .preprocess(
      (value) => (value === "" || value == null ? null : value),
      z.string().date().nullable(),
    )
    .optional(),
});

/** Save a suggested goal (from /goals/suggest) as an active health goal. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please provide a valid suggested goal.", 400);

  const { data, error } = await supabase
    .from("health_goals")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      target_value: parsed.data.target_value ?? null,
      unit: parsed.data.unit ?? null,
      target_date: parsed.data.target_date ?? null,
      status: "active",
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "goal_suggestion_accepted",
      entity: "health_goals",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: parsed.data.title, category: parsed.data.category },
    },
    supabase,
  );

  return jsonOk({ goal: data }, 201);
}
