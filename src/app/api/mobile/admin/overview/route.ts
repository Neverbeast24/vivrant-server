export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isMobileAuthError,
  isSuperAdminRole,
  requireMobileStaff,
} from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

/** Platform pulse for staff — mirrors `/admin` overview counts. */
export async function GET(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  const superAdmin = isSuperAdminRole(auth.profile.role);
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const empty = Promise.resolve({ count: 0 });
  const [
    users,
    logs,
    admins,
    suspended,
    openTickets,
    openInquiries,
    meals,
    workouts,
    checkins,
    gymSessions,
  ] = await Promise.all([
    admin.from("profiles").select("user_id", { count: "exact", head: true }),
    admin.from("audit_logs").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .in("role", ["admin", "super_admin"]),
    admin
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "suspended"),
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    superAdmin
      ? admin
          .from("contact_inquiries")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress"])
      : empty,
    superAdmin
      ? admin.from("nutrition_logs").select("id", { count: "exact", head: true })
      : empty,
    superAdmin
      ? admin.from("workout_logs").select("id", { count: "exact", head: true })
      : empty,
    superAdmin
      ? admin.from("daily_checkins").select("id", { count: "exact", head: true })
      : empty,
    superAdmin
      ? admin.from("gym_sessions").select("id", { count: "exact", head: true })
      : empty,
  ]);

  const { data: recentLogs } = await admin
    .from("audit_logs")
    .select("id, action, entity, actor_id, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentUsers } = await admin
    .from("profiles")
    .select("user_id, display_name, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  return jsonOk({
    isSuperAdmin: superAdmin,
    counts: {
      users: users.count ?? 0,
      auditLogs: logs.count ?? 0,
      staff: admins.count ?? 0,
      suspended: suspended.count ?? 0,
      openTickets: openTickets.count ?? 0,
      openInquiries: openInquiries.count ?? 0,
      meals: meals.count ?? 0,
      workouts: workouts.count ?? 0,
      checkins: checkins.count ?? 0,
      gymSessions: gymSessions.count ?? 0,
    },
    recentLogs: recentLogs ?? [],
    recentUsers: recentUsers ?? [],
  });
}
