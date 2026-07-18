import type { UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile };
}

export function isStaff(role: UserRole | undefined | null) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: UserRole | undefined | null) {
  return role === "super_admin";
}

export async function requireStaff() {
  const { user, profile } = await getCurrentProfile();
  if (!user || !isStaff(profile?.role as UserRole)) {
    return null;
  }
  return { user, profile };
}
