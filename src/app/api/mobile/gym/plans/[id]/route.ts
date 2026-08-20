import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, parseIdParam, readJson } from "@/lib/mobile/http";
import { archiveGymPlan } from "@/lib/archive";
import { updateSavedGymPlan } from "@/lib/gym-plan-generate";

export const runtime = "nodejs";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(800).optional().nullable(),
  focus: z.string().trim().max(60).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  days: z.array(z.unknown()).min(1).max(7),
  recommendations: z.array(z.string()).max(8).optional(),
  training_days: z.array(z.number().int().min(1).max(7)).max(6).optional(),
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
  if (id == null) return jsonError("Invalid plan id.", 400);

  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the program title and days, then save.", 400);

  const result = await updateSavedGymPlan(supabase, user.id, id, parsed.data);
  if (!result.ok) return jsonError(result.message, 400);

  return jsonOk({ plan: result.plan });
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
  if (id == null) return jsonError("Invalid plan id.", 400);

  const result = await archiveGymPlan(supabase, { id, userId: user.id });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
