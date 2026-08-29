import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ARCHIVE_TABLES } from "@/lib/archive-catalog";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

const BACKUP_TABLES = [
  "profiles",
  "user_settings",
  "daily_checkins",
  ...ARCHIVE_TABLES,
  "habit_logs",
  "challenge_progress",
  "ai_recommendations",
  "ai_chat_messages",
  "archived_records",
] as const;

export type UserBackupDump = {
  taken_at: string;
  user_id: string;
  tables: Record<string, unknown[]>;
};

export async function dumpUserData(admin: SupabaseClient, userId: string): Promise<UserBackupDump> {
  const tables: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    const { data, error } = await admin.from(table).select("*").eq("user_id", userId);
    if (error) {
      tables[table] = [{ _backup_error: error.message }];
      continue;
    }
    tables[table] = data ?? [];
  }

  // audit_logs is keyed by actor_id (same shape as audit_logs_rows.json).
  const { data: audit, error: auditError } = await admin
    .from("audit_logs")
    .select("id, actor_id, action, entity, entity_id, metadata, created_at")
    .eq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  tables.audit_logs = auditError
    ? [{ _backup_error: auditError.message }]
    : (audit ?? []);

  return { taken_at: new Date().toISOString(), user_id: userId, tables };
}

export async function writeScheduledBackup(userId: string) {
  const admin = createAdminClient();
  const dump = await dumpUserData(admin, userId);
  const { error } = await admin.from("internal_backups").insert({
    user_id: userId,
    kind: "scheduled",
    entity: "account",
    entity_id: userId,
    payload: dump,
  });
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, dump };
}

export async function writeExportBackup(_supabase: SupabaseClient, userId: string) {
  const admin = createAdminClient();
  const dump = await dumpUserData(admin, userId);
  // Persist with the service role so a member JWT / RLS miss cannot block the download.
  const { error } = await admin.from("internal_backups").insert({
    user_id: userId,
    kind: "export",
    entity: "account",
    entity_id: userId,
    payload: dump,
  });
  if (error) {
    logger.warn("backup", "Could not persist export snapshot", { message: error.message });
  }
  return { ok: true as const, dump };
}

export async function runScheduledBackups(limit = 200) {
  const admin = createAdminClient();

  const userIds: string[] = [];
  let cursor: string | null = null;
  for (;;) {
    let query = admin.from("profiles").select("user_id").order("user_id").limit(1000);
    if (cursor) query = query.gt("user_id", cursor);
    const { data, error } = await query;
    if (error) return { ok: false as const, message: error.message, backed_up: 0 };
    const batch = (data ?? []).map((row) => String(row.user_id)).filter(Boolean);
    if (!batch.length) break;
    userIds.push(...batch);
    cursor = batch[batch.length - 1] ?? null;
    if (batch.length < 1000) break;
  }

  const lastBackupAt = new Map<string, number>();
  const { data: backups } = await admin
    .from("internal_backups")
    .select("user_id, created_at")
    .eq("kind", "scheduled")
    .order("created_at", { ascending: false })
    .limit(5000);
  for (const row of backups ?? []) {
    const userId = String(row.user_id);
    if (!lastBackupAt.has(userId)) {
      lastBackupAt.set(userId, Date.parse(String(row.created_at)) || 0);
    }
  }

  const selected = [...userIds]
    .sort((a, b) => (lastBackupAt.get(a) ?? 0) - (lastBackupAt.get(b) ?? 0))
    .slice(0, limit);

  let backedUp = 0;
  const failures: string[] = [];
  for (const userId of selected) {
    const result = await writeScheduledBackup(userId);
    if (result.ok) backedUp += 1;
    else failures.push(`${userId}: ${result.message}`);
  }

  return { ok: failures.length === 0, backed_up: backedUp, failures };
}
