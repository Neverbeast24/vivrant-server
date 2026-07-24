import { AdminShell } from "@/components/admin/shell";
import { isSuperAdmin, requireStaff } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

function countSystemIssues() {
  let issues = 0;
  if (!process.env.GEMINI_API_KEY?.trim()) issues += 1;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()) issues += 1;
  if (!process.env.RESEND_API_KEY?.trim()) issues += 1;
  return issues;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireStaff();
  const supabase = await createClient();
  const superAdmin = isSuperAdmin(profile?.role as UserRole);

  const [
    { data: notifications },
    { data: settings },
    { count: openTickets },
    inquiryResult,
  ] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at, href")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("user_settings")
      .select("notifications_enabled, theme")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    superAdmin
      ? supabase
          .from("contact_inquiries")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress"])
      : Promise.resolve({ count: 0 }),
  ]);

  const systemIssues = countSystemIssues();
  const navBadges: Record<string, number> = {};
  if ((openTickets ?? 0) > 0) navBadges["/admin/tickets"] = openTickets ?? 0;
  if (superAdmin && (inquiryResult.count ?? 0) > 0) {
    navBadges["/admin/inquiries"] = inquiryResult.count ?? 0;
  }
  if (systemIssues > 0) navBadges["/admin/settings"] = systemIssues;

  return (
    <AdminShell
      displayName={profile?.display_name ?? "Admin"}
      isSuperAdmin={superAdmin}
      notifications={notifications ?? []}
      pushEnabled={settings?.notifications_enabled ?? true}
      theme={settings?.theme ?? null}
      navBadges={navBadges}
    >
      {children}
    </AdminShell>
  );
}
