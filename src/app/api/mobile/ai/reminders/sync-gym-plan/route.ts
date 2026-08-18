export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { computeNextFireAt } from "@/lib/reminders/schedule";
import { hydrateGymPlan } from "@/lib/gym";
import { reminderDaysFromGymPlan } from "@/lib/gym-schedule";

/** Create/refresh reminders from the member's latest active gym plan. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: plan } = await supabase
    .from("gym_plans")
    .select("id, title, days_per_week, days, focus")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return jsonError("No gym plan found. Generate one first.", 404);

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  const timezone = settings?.timezone || "Asia/Manila";

  const defaultDays = reminderDaysFromGymPlan(hydrateGymPlan(plan));

  await supabase
    .from("user_reminders")
    .delete()
    .eq("user_id", user.id)
    .eq("kind", "plan")
    .eq("source_id", String(plan.id));

  const schedule_time = "07:30";
  const next = computeNextFireAt({
    scheduleTime: schedule_time,
    daysOfWeek: defaultDays,
    timezone,
  });

  const { data: reminder, error } = await supabase
    .from("user_reminders")
    .insert({
      user_id: user.id,
      title: `Gym: ${plan.title}`.slice(0, 120),
      body: `Training day for your ${plan.focus || "gym"} plan. Lace up and log the session.`.slice(
        0,
        500,
      ),
      kind: "plan",
      schedule_time,
      days_of_week: defaultDays,
      href: "/dashboard/movement/log",
      source_id: String(plan.id),
      enabled: true,
      timezone,
      next_fire_at: next.toISOString(),
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "gym_plan_reminders_synced",
      entity: "user_reminders",
      metadata: { plan_id: plan.id, days: defaultDays },
    },
    supabase,
  );

  return jsonOk({ reminder, days: defaultDays });
}
