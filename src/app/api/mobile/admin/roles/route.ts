export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileStaff } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { MODULES, ROLE_LABELS, type UserRole } from "@/lib/types";

const permissions = [
  { module: "User Management", user: "—", admin: "Read / Update status", super: "Full + roles" },
  { module: "Roles & Permissions", user: "—", admin: "Read", super: "Full" },
  { module: "Audit Logs", user: "—", admin: "Read", super: "Full" },
  { module: "Platform Settings", user: "—", admin: "Read + broadcast", super: "Full" },
  { module: "Member Activity", user: "—", admin: "—", super: "Full read" },
  { module: "Dashboard modules", user: "Own data", admin: "Own data", super: "Own + all members" },
  { module: "Gym / History / Goals", user: "Own data", admin: "Own data", super: "Own + all members" },
  { module: "AI Decision Engine", user: "Own insights", admin: "Own insights", super: "Own + member summaries" },
  { module: "Notifications", user: "Own inbox", admin: "Own + broadcast", super: "Own + broadcast" },
];

/** Roles matrix + counts — mirrors `/admin/roles`. */
export async function GET(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  const counts = await Promise.all(
    roles.map((role) =>
      admin
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", role),
    ),
  );

  return jsonOk({
    roleCounts: roles.map((role, index) => ({
      role,
      label: ROLE_LABELS[role],
      count: counts[index].count ?? 0,
    })),
    permissions,
    modules: [...MODULES],
  });
}
