import { UsersTable } from "./table";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="font-display text-4xl">User Management</h1>
      <p className="mt-2 text-sm text-[#77727f]">
        View and manage all VIVA accounts. Update roles and account status.
      </p>
      <div className="mt-8">
        <UsersTable users={(data ?? []) as Profile[]} />
      </div>
    </>
  );
}
