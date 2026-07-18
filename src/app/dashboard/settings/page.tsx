import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
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
