import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MindfulnessView } from "@/components/dashboard/mindfulness";

export const metadata: Metadata = { title: "Mindfulness" };

export default async function MindfulnessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);

  const { data } = await supabase
    .from("daily_checkins")
    .select("checkin_date, mood")
    .eq("user_id", user.id)
    .gte("checkin_date", weekStart.toISOString().slice(0, 10))
    .order("checkin_date", { ascending: false });

  const weekMoods = data ?? [];
  const todayMood = weekMoods.find((r) => r.checkin_date === today)?.mood ?? null;

  return <MindfulnessView todayMood={todayMood} weekMoods={weekMoods} />;
}
