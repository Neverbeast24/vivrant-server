import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const habitSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z
    .enum(["nutrition", "movement", "sleep", "mindfulness", "hydration", "other"])
    .default("other"),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  target_per_period: z.coerce.number().int().min(1).max(14).default(1),
});

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const today = todayDate();
  const [{ data: habits, error }, { data: logs }] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("logged_on", today),
  ]);

  if (error) return jsonError(error.message, 500);

  const doneIds = new Set((logs ?? []).map((l) => l.habit_id));
  const enriched = (habits ?? []).map((habit) => ({
    ...habit,
    done_today: doneIds.has(habit.id),
  }));

  return jsonOk({ habits: enriched });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = habitSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a habit title.");

  const { data: habit, error } = await supabase
    .from("habits")
    .insert({ user_id: user.id, ...parsed.data, active: true })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "habit_created",
      entity: "habits",
      entityId: String(habit.id),
      metadata: { title: parsed.data.title },
    },
    supabase,
  );

  return jsonOk({ habit });
}
