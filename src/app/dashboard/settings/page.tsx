import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <SettingsView
      settings={{
        theme: data?.theme ?? "light",
        notifications_enabled: data?.notifications_enabled ?? true,
        weekly_report_enabled: data?.weekly_report_enabled ?? true,
        timezone: data?.timezone ?? "Asia/Manila",
      }}
    />
  );
}
