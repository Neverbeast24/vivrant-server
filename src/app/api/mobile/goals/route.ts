export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const goalSchema = z.object({
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

/** List the member's health goals. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("health_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ goals: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in a valid goal.", 400);

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
      action: "goal_created",
      entity: "health_goals",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: parsed.data.title, category: parsed.data.category },
    },
    supabase,
  );

  return jsonOk({ goal: data }, 201);
}
