import { quietSoftDelete } from "@/lib/archive";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { computeNextFireAt } from "@/lib/reminders/schedule";

export const runtime = "nodejs";

const HYDRATION_SLOTS = [
  { time: "10:00", body: "Mid-morning sip — refill your bottle." },
  { time: "14:00", body: "Afternoon hydration check — one glass now." },
  { time: "17:00", body: "Early evening water before dinner." },
];

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  const timezone = settings?.timezone || "Asia/Manila";

  const cleared = await quietSoftDelete(supabase, {
    table: "user_reminders",
    userId: user.id,
    match: { kind: "hydration", source_id: "hydration-preset" },
  });
  if (!cleared.ok) return jsonError(cleared.message, 500);

  const rows = HYDRATION_SLOTS.map((slot) => ({
    user_id: user.id,
    title: "Drink water",
    body: slot.body,
    kind: "hydration" as const,
    schedule_time: slot.time,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    href: "/dashboard/hydration",
    source_id: "hydration-preset",
    enabled: true,
    timezone,
    next_fire_at: computeNextFireAt({
      scheduleTime: slot.time,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      timezone,
    }).toISOString(),
  }));

  const { data: reminders, error } = await supabase
    .from("user_reminders")
    .insert(rows)
    .select();

  if (error) return jsonError(error.message, 500);

  return jsonOk({
    reminders: reminders ?? [],
    message: "Hydration reminders set for 10:00, 14:00, and 17:00.",
  });
}
