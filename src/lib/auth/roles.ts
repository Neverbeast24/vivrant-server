import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the signed-in user or redirects to /login. Dashboard pages must use
 * this instead of `user!` — a stale session otherwise crashes with a 500.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

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
  if (!user) redirect("/login?next=/admin");
  if (profile?.status === "suspended") {
    redirect("/login?error=" + encodeURIComponent("Your account has been suspended."));
  }
  if (!isStaff(profile?.role as UserRole)) redirect("/dashboard");
  return { user, profile };
}

export async function requireSuperAdmin() {
  const { user, profile } = await requireStaff();
  if (!isSuperAdmin(profile?.role as UserRole)) redirect("/admin");
  return { user, profile };
}
