import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatActivityItems, type ActivityItem, type AuditLogRow } from "@/lib/activity-format";

export type { ActivityItem, AuditLogRow } from "@/lib/activity-format";
export { formatActivityItem, formatActivityItems, parseAuditMetadata } from "@/lib/activity-format";

export async function listUserActivity(
  supabase: SupabaseClient,
  userId: string,
  options?: { entity?: string; limit?: number },
): Promise<{ ok: true; items: ActivityItem[] } | { ok: false; message: string; items: ActivityItem[] }> {
  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 500);
  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity, entity_id, metadata, created_at")
    .eq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.entity) query = query.eq("entity", options.entity);

  const { data, error } = await query;
  if (error) return { ok: false, message: error.message, items: [] };

  return {
    ok: true,
    items: formatActivityItems((data ?? []) as AuditLogRow[]),
  };
}
