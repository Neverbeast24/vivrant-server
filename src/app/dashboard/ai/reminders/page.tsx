import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { processDueReminders } from "@/lib/reminders/process";
import { parseListOrder } from "@/lib/reorder";
import { AiView } from "@/components/dashboard/ai";

export const metadata: Metadata = { title: "AI Reminders" };

export default async function AiRemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await processDueReminders({ userId: user.id });

  const [{ data }, settingsRes] = await Promise.all([
    supabase
      .from("user_reminders")
      .select(
        "id, title, body, kind, schedule_time, days_of_week, enabled, next_fire_at, href",
      )
      .eq("user_id", user.id)
      .order("next_fire_at", { ascending: true }),
    supabase.from("user_settings").select("list_order").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <AiView
      insights={[]}
      section="reminders"
      reminders={data ?? []}
      listOrder={parseListOrder(settingsRes.data?.list_order).reminders ?? []}
    />
  );
}
