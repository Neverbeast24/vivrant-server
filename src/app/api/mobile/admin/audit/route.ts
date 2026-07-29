export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileStaff } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

/** Staff audit trail. */
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
    .from("audit_logs")
    .select("id, action, entity, entity_id, actor_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) return jsonError(error.message, 500);

  const actorIds = [
    ...new Set((data ?? []).map((log) => log.actor_id).filter(Boolean)),
  ] as string[];

  const { data: actors } = actorIds.length
    ? await admin
        .from("profiles")
        .select("user_id, display_name, email, role")
        .in("user_id", actorIds)
    : { data: [] as { user_id: string; display_name: string; email: string | null; role: string }[] };

  const actorMap = new Map((actors ?? []).map((row) => [row.user_id, row]));

  const logs = (data ?? []).map((log) => {
    const actor = log.actor_id ? actorMap.get(log.actor_id) : null;
    return {
      ...log,
      actor_name: actor?.display_name ?? "Unknown",
      actor_email: actor?.email ?? null,
      actor_role: actor?.role ?? null,
    };
  });

  return jsonOk({ logs });
}
