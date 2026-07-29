export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isMobileAuthError,
  isSuperAdminRole,
  requireMobileStaff,
} from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

/** List all member profiles for staff user management. */
export async function GET(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data, error } = await admin
    .from("profiles")
    .select("user_id, display_name, email, role, status, created_at, avatar_url")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return jsonError(error.message, 500);

  return jsonOk({
    users: data ?? [],
    canManageRoles: isSuperAdminRole(auth.profile.role),
    viewerRole: auth.profile.role,
  });
}
