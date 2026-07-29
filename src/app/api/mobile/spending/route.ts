import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { getPhCalendarDate } from "@/lib/groceries/ph-price-catalog";

export const runtime = "nodejs";

/** Month totals: spend this PH month vs. monthly_health_budget. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user, profile } = auth;

  const ph = getPhCalendarDate();
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .gte("spent_at", ph.monthStart);

  if (error) return jsonError(error.message, 500);

  const spent = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const budget = Number(profile.monthly_health_budget ?? 2000);
  const remaining = Math.max(0, budget - spent);

  return jsonOk({
    budget,
    spent: Math.round(spent),
    remaining: Math.round(remaining),
    currency: "PHP",
  });
}
