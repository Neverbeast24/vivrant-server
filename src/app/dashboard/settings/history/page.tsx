import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Health History" };

export default async function HistorySettingsPage() {
  const { supabase, user } = await requireUser();

  const [settingsRes, profileRes, historyRes] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("health_history")
      .select("id, recorded_at, weight_kg, height_cm, body_fat_pct, waist_cm, note, source")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(40),
  ]);
  const data = settingsRes.data;
  const profile = profileRes.data;

  return (
    <SettingsView
      section="history"
      settings={{
        theme: data?.theme ?? "light",
        notifications_enabled: data?.notifications_enabled ?? true,
        weekly_report_enabled: data?.weekly_report_enabled ?? true,
        timezone: data?.timezone ?? "Asia/Manila",
      }}
      profile={{
        display_name: profile?.display_name ?? "VIVA member",
        email: profile?.email ?? user.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        birth_date: profile?.birth_date ?? null,
        sex: profile?.sex ?? null,
        height_cm: profile?.height_cm ?? null,
        weight_kg: profile?.weight_kg ?? null,
        goal_weight_kg: profile?.goal_weight_kg ?? null,
        activity_level: profile?.activity_level ?? null,
        health_focus: profile?.health_focus ?? "general",
        daily_step_goal: profile?.daily_step_goal ?? 8000,
        daily_water_goal_ml: profile?.daily_water_goal_ml ?? 2400,
        monthly_health_budget: Number(profile?.monthly_health_budget ?? 2000),
        bio: profile?.bio ?? null,
      }}
      history={(historyRes.data ?? []).map((entry) => ({
        ...entry,
        weight_kg: entry.weight_kg == null ? null : Number(entry.weight_kg),
        height_cm: entry.height_cm == null ? null : Number(entry.height_cm),
        body_fat_pct: entry.body_fat_pct == null ? null : Number(entry.body_fat_pct),
        waist_cm: entry.waist_cm == null ? null : Number(entry.waist_cm),
      }))}
    />
  );
}
