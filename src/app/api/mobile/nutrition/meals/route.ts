import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { dayStartIso, jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { syncGoalProgress } from "@/lib/goals/progress";

export const runtime = "nodejs";

const mealSchema = z.object({
  meal_name: z.string().trim().min(1).max(120),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.coerce.number().int().min(0).optional(),
  protein_g: z.coerce.number().min(0).optional(),
  carbs_g: z.coerce.number().min(0).optional(),
  fat_g: z.coerce.number().min(0).optional(),
});

function dayRange(dateParam: string | null) {
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayDate();
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: dayStartIso(start), endIso: dayStartIso(end) };
}

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const { startIso, endIso } = dayRange(searchParams.get("date"));

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", startIso)
    .lt("logged_at", endIso)
    .order("logged_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ meals: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = mealSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Provide meal_name, meal_type, and optional macros.");
  }

  const { data: meal, error } = await supabase
    .from("nutrition_logs")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "meal_logged",
      entity: "nutrition_logs",
      entityId: String(meal.id),
      metadata: { meal_name: parsed.data.meal_name, meal_type: parsed.data.meal_type },
    },
    supabase,
  );
  void syncGoalProgress(supabase, user.id).catch(() => null);

  return jsonOk({ meal });
}
