export const runtime = "nodejs";

import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isMobileAuthError,
  isStaffRole,
  isSuperAdminRole,
  requireMobileStaff,
} from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";

const patchSchema = z
  .object({
    role: z.enum(["user", "admin", "super_admin"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => v.role != null || v.status != null, {
    message: "Provide role and/or status.",
  });

/** Update a member's role (super admin) and/or status (staff). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  const { id: userId } = await context.params;
  if (!userId) return jsonError("Missing user id.", 400);

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid update.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data: target } = await admin
    .from("profiles")
    .select("role, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!target) return jsonError("User not found.", 404);

  if (parsed.data.role != null) {
    if (!isSuperAdminRole(auth.profile.role)) {
      return jsonError("Only Super Admin can change roles.", 403);
    }
    if (target.role === "super_admin" && parsed.data.role !== "super_admin") {
      const { count } = await admin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin");
      if ((count ?? 0) <= 1) {
        return jsonError("You cannot demote the last Super Admin.", 400);
      }
      if (auth.user.id === userId) {
        return jsonError("You cannot demote your own Super Admin role.", 400);
      }
    }
  }

  if (parsed.data.status != null) {
    if (!isStaffRole(auth.profile.role)) {
      return jsonError("You do not have permission to change status.", 403);
    }
    if (
      target.role === "super_admin" &&
      (!isSuperAdminRole(auth.profile.role) || auth.user.id === userId)
    ) {
      return jsonError("A Super Admin cannot suspend this account.", 400);
    }
    if (
      target.role === "super_admin" &&
      parsed.data.status === "suspended" &&
      target.status !== "suspended"
    ) {
      const { count } = await admin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return jsonError("You cannot suspend the last active Super Admin.", 400);
      }
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .update({
      ...(parsed.data.role != null ? { role: parsed.data.role } : {}),
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
    })
    .eq("user_id", userId)
    .select("user_id, display_name, email, role, status, created_at, avatar_url")
    .single();

  if (error) return jsonError(error.message, 500);

  if (parsed.data.role != null) {
    await writeAuditLog(
      {
        action: "role_updated",
        entity: "profiles",
        entityId: userId,
        metadata: { role: parsed.data.role },
      },
      auth.supabase,
    );
  }
  if (parsed.data.status != null) {
    await writeAuditLog(
      {
        action: "status_updated",
        entity: "profiles",
        entityId: userId,
        metadata: { status: parsed.data.status },
      },
      auth.supabase,
    );
  }

  return jsonOk({ user: data });
}
