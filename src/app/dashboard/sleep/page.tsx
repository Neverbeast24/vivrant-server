import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SleepView } from "@/components/dashboard/sleep";

export const metadata: Metadata = { title: "Sleep" };

export default async function SleepPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const start = new Date();
  start.setDate(start.getDate() - 29);
  const { data } = await supabase
    .from("daily_checkins")
    .select("checkin_date, sleep_minutes, sleep_quality")
    .eq("user_id", user.id)
    .gte("checkin_date", start.toISOString().slice(0, 10))
    .order("checkin_date", { ascending: false })
    .limit(30);

  const rows = data ?? [];
  const withSleep = rows.filter((r) => r.sleep_minutes != null);
  const avgMinutes = withSleep.length
    ? withSleep.reduce((s, r) => s + Number(r.sleep_minutes ?? 0), 0) / withSleep.length
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const lastNight =
    rows.find((r) => r.checkin_date === today)?.sleep_minutes ??
    rows.find((r) => r.sleep_minutes != null)?.sleep_minutes ??
    null;

  return (
    <SleepView
      rows={rows.slice(0, 14)}
      avgMinutes={avgMinutes}
      lastNight={lastNight != null ? Number(lastNight) : null}
    />
  );
}
