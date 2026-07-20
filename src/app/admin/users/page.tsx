import { UsersTable } from "./table";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import { getCurrentProfile, isSuperAdmin } from "@/lib/auth/roles";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();
  const viewerRole = (profile?.role ?? "user") as UserRole;
  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, role, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="font-display text-4xl">User Management</h1>
      <p className="mt-2 text-sm text-[#5a6b62]">
        View and manage all VIVRΛNT accounts. Update roles and account status.
      </p>
      <div className="mt-8">
        <UsersTable
          users={(data ?? []) as Profile[]}
          canManageRoles={isSuperAdmin(viewerRole)}
          viewerRole={viewerRole}
        />
      </div>
    </>
  );
}
