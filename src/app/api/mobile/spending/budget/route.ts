import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const budgetSchema = z.object({
  amount: z.coerce.number().min(0).max(10000000),
});

/** Update profiles.monthly_health_budget. */
export async function PUT(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a valid monthly budget.", 400);

  const { error } = await supabase
    .from("profiles")
    .update({ monthly_health_budget: parsed.data.amount })
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "monthly_budget_updated",
      entity: "profiles",
      entityId: user.id,
      metadata: { monthly_health_budget: parsed.data.amount },
    },
    supabase,
  );

  return jsonOk({ budget: parsed.data.amount });
}
