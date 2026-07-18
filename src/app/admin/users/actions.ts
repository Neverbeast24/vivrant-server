"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentProfile, isStaff, isSuperAdmin } from "@/lib/auth/roles";
import type { UserRole, UserStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const roleSchema = z.enum(["user", "admin", "super_admin"]);
const statusSchema = z.enum(["active", "suspended"]);

export async function updateUserRole(userId: string, role: UserRole) {
  const { profile } = await getCurrentProfile();
  if (!isSuperAdmin(profile?.role as UserRole)) {
    return { ok: false, message: "Only Super Admin can change roles." };
  }
  if (!roleSchema.safeParse(role).success) {
    return { ok: false, message: "Invalid role." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "role_updated",
    entity: "profiles",
    entityId: userId,
    metadata: { role },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated." };
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const { user, profile } = await getCurrentProfile();
  if (!isStaff(profile?.role as UserRole)) {
    return { ok: false, message: "You do not have permission to change status." };
  }
  if (!statusSchema.safeParse(status).success) {
    return { ok: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (
    target?.role === "super_admin" &&
    (!isSuperAdmin(profile?.role as UserRole) || user?.id === userId)
  ) {
    return { ok: false, message: "A Super Admin cannot suspend this account." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("user_id", userId);

  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "status_updated",
    entity: "profiles",
    entityId: userId,
    metadata: { status },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Status updated." };
}
