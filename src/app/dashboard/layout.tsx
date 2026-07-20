import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isStaff, isSuperAdmin } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, role, status")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (profile?.status === "suspended") {
    redirect("/login?error=Your account has been suspended.");
  }

  const displayName =
    profile?.display_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "VIVA member";

  return (
    <DashboardShell
      displayName={displayName}
      nickname={user.email?.split("@")[0] ?? "viva-member"}
      avatarUrl={profile?.avatar_url ?? null}
      isStaff={isStaff(profile?.role as UserRole)}
      isSuperAdmin={isSuperAdmin(profile?.role as UserRole)}
      notifications={notifications ?? []}
    >
      {children}
    </DashboardShell>
  );
}
