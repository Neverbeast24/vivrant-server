import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getCurrentProfile, isStaff } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login?next=/admin");
  if (!isStaff(profile?.role as UserRole)) redirect("/dashboard");

  return (
    <AdminShell displayName={profile?.display_name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
