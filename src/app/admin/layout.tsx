import { AdminShell } from "@/components/admin/shell";
import { isSuperAdmin, requireStaff } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff();

  return (
    <AdminShell
      displayName={profile?.display_name ?? "Admin"}
      isSuperAdmin={isSuperAdmin(profile?.role as UserRole)}
    >
      {children}
    </AdminShell>
  );
}
