import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import {
  ARCHIVE_LABELS,
  isArchiveTable,
  titleFromRow,
  type ArchiveTable,
} from "@/lib/archive-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export {
  ARCHIVE_LABELS,
  ARCHIVE_TABLES,
  isArchiveTable,
  titleFromRow,
  type ArchiveTable,
} from "@/lib/archive-catalog";

export type ArchiveResult = { ok: true; message: string } | { ok: false; message: string };

type Row = Record<string, unknown>;

function softDeleteFields(table: ArchiveTable): Record<string, unknown> {
  const fields: Record<string, unknown> = { deleted_at: new Date().toISOString() };
  if (table === "user_reminders") fields.enabled = false;
  return fields;
}

function restoreFields(table: ArchiveTable): Record<string, unknown> {
  const fields: Record<string, unknown> = { deleted_at: null };
  if (table === "user_reminders") fields.enabled = true;
  return fields;
}

const MODULE_PATHS: Record<ArchiveTable, readonly string[]> = {
  nutrition_logs: ["/dashboard/nutrition", "/dashboard/nutrition/log", "/dashboard/nutrition/sheet", "/dashboard/kitchen"],
  workout_logs: ["/dashboard/movement/log", "/dashboard/training"],
  expenses: ["/dashboard/spending", "/dashboard/spending/sheet", "/dashboard/spending/log"],
  pantry_items: ["/dashboard/pantry", "/dashboard/pantry/sheet", "/dashboard/pantry/items", "/dashboard/kitchen"],
  grocery_items: ["/dashboard/groceries", "/dashboard/groceries/sheet", "/dashboard/kitchen"],
  health_goals: ["/dashboard/settings/goals"],
  health_history: ["/dashboard/settings/history"],
  gym_sessions: ["/dashboard/gym", "/dashboard/training"],
  gym_plans: ["/dashboard/gym", "/dashboard/gym/plans", "/dashboard/training"],
  habits: ["/dashboard/habits"],
  challenges: ["/dashboard/habits/challenges"],
  journal_entries: ["/dashboard/journal"],
  user_reminders: ["/dashboard/ai/reminders"],
};

function revalidateArchivedModule(table: ArchiveTable) {
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard");
  for (const path of MODULE_PATHS[table]) revalidatePath(path);
}

async function loadOwnedRow(
  supabase: SupabaseClient,
  table: ArchiveTable,
  id: number,
  userId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { row: null, message: error.message };
  if (!data) return { row: null, message: `${ARCHIVE_LABELS[table]} not found.` };
  return { row: data as Row, message: null };
}

async function snapshotBackup(
  supabase: SupabaseClient,
  input: {
    userId: string;
    table: ArchiveTable;
    id: number;
    title: string;
    row: Row;
  },
) {
  await supabase.from("internal_backups").insert({
    user_id: input.userId,
    kind: "archive",
    entity: input.table,
    entity_id: String(input.id),
    payload: { title: input.title, row: input.row, archived_at: new Date().toISOString() },
  });
}

export async function archiveRecord(
  supabase: SupabaseClient,
  input: {
    table: ArchiveTable;
    id: number;
    userId: string;
    auditAction?: string;
  },
): Promise<ArchiveResult> {
  const loaded = await loadOwnedRow(supabase, input.table, input.id, input.userId);
  if (!loaded.row) return { ok: false, message: loaded.message ?? "Not found." };

  const title = titleFromRow(input.table, loaded.row);
  const { error: archiveError } = await supabase.from("archived_records").insert({
    user_id: input.userId,
    entity: input.table,
    entity_id: String(input.id),
    title,
    snapshot: loaded.row,
  });
  if (archiveError) {
    const duplicate =
      archiveError.code === "23505" || /duplicate key/i.test(archiveError.message);
    if (!duplicate) return { ok: false, message: archiveError.message };
  }

  await snapshotBackup(supabase, {
    userId: input.userId,
    table: input.table,
    id: input.id,
    title,
    row: loaded.row,
  });

  const { error } = await supabase
    .from(input.table)
    .update(softDeleteFields(input.table))
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog(
    {
      action: input.auditAction ?? `${input.table}_archived`,
      entity: input.table,
      entityId: String(input.id),
      metadata: { title, soft_delete: true },
    },
    supabase,
  );

  revalidateArchivedModule(input.table);
  return { ok: true, message: `${ARCHIVE_LABELS[input.table]} moved to Archived.` };
}

/** Hide system-generated rows without cluttering the member Archive list. */
export async function quietSoftDelete(
  supabase: SupabaseClient,
  input: {
    table: ArchiveTable;
    userId: string;
    match: Record<string, string | number | boolean>;
  },
): Promise<ArchiveResult> {
  let query = supabase
    .from(input.table)
    .update(softDeleteFields(input.table))
    .eq("user_id", input.userId);
  for (const [key, value] of Object.entries(input.match)) {
    query = query.eq(key, value);
  }
  const { error } = await query;
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Cleared." };
}

export async function archiveMatching(
  supabase: SupabaseClient,
  input: {
    table: ArchiveTable;
    userId: string;
    match: Record<string, string | number | boolean>;
    auditAction?: string;
  },
): Promise<ArchiveResult> {
  let query = supabase.from(input.table).select("*").eq("user_id", input.userId);
  for (const [key, value] of Object.entries(input.match)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) return { ok: false, message: error.message };
  const rows = (data ?? []) as Row[];
  if (!rows.length) return { ok: true, message: "Nothing to archive." };

  let archived = 0;
  let lastError: string | null = null;
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) continue;
    const result = await archiveRecord(supabase, {
      table: input.table,
      id,
      userId: input.userId,
      auditAction: input.auditAction,
    });
    if (result.ok) archived += 1;
    else lastError = result.message;
  }

  if (archived === 0) {
    return { ok: false, message: lastError ?? "Nothing to archive." };
  }

  return {
    ok: true,
    message:
      archived === 1
        ? `${ARCHIVE_LABELS[input.table]} moved to Archived.`
        : `${archived} items moved to Archived.`,
  };
}

export type ArchivedRecord = {
  id: number;
  entity: ArchiveTable;
  entity_id: string;
  title: string;
  snapshot: Row;
  deleted_at: string;
  restored_at: string | null;
};

export async function listArchivedRecords(supabase: SupabaseClient, userId: string, limit = 200) {
  const { data, error } = await supabase
    .from("archived_records")
    .select("id, entity, entity_id, title, snapshot, deleted_at, restored_at")
    .eq("user_id", userId)
    .is("restored_at", null)
    .order("deleted_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false as const, message: error.message, items: [] as ArchivedRecord[] };

  const items = (data ?? [])
    .filter((row) => isArchiveTable(String(row.entity)))
    .map((row) => ({
      id: Number(row.id),
      entity: row.entity as ArchiveTable,
      entity_id: String(row.entity_id),
      title: String(row.title ?? ""),
      snapshot: (row.snapshot ?? {}) as Row,
      deleted_at: String(row.deleted_at),
      restored_at: row.restored_at ? String(row.restored_at) : null,
    }));

  return { ok: true as const, items };
}

export async function restoreArchivedRecord(
  supabase: SupabaseClient,
  input: { archiveId: number; userId: string },
): Promise<ArchiveResult> {
  const { data: archived, error: loadError } = await supabase
    .from("archived_records")
    .select("id, entity, entity_id, title, restored_at")
    .eq("id", input.archiveId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (loadError) return { ok: false, message: loadError.message };
  if (!archived) return { ok: false, message: "Archived item not found." };
  if (archived.restored_at) return { ok: false, message: "Already restored." };
  if (!isArchiveTable(String(archived.entity))) {
    return { ok: false, message: "This item cannot be restored." };
  }

  const entity = archived.entity as ArchiveTable;
  const entityId = Number(archived.entity_id);
  if (!Number.isFinite(entityId)) return { ok: false, message: "Invalid archived item." };

  const admin = createAdminClient();
  const { data: restored, error: restoreError } = await admin
    .from(entity)
    .update(restoreFields(entity))
    .eq("id", entityId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();
  if (restoreError) return { ok: false, message: restoreError.message };
  if (!restored) {
    return { ok: false, message: "Could not restore this item. It may have been permanently removed." };
  }

  const { error: markError } = await supabase
    .from("archived_records")
    .update({ restored_at: new Date().toISOString() })
    .eq("id", input.archiveId)
    .eq("user_id", input.userId);
  if (markError) return { ok: false, message: markError.message };

  await writeAuditLog(
    {
      action: `${entity}_restored`,
      entity,
      entityId: String(entityId),
      metadata: { title: archived.title, archive_id: input.archiveId },
    },
    supabase,
  );

  revalidateArchivedModule(entity);
  return { ok: true, message: `${ARCHIVE_LABELS[entity]} restored.` };
}

export async function archiveGymPlan(
  supabase: SupabaseClient,
  input: { id: number; userId: string },
): Promise<ArchiveResult> {
  const result = await archiveRecord(supabase, {
    table: "gym_plans",
    id: input.id,
    userId: input.userId,
    auditAction: "gym_plan_deleted",
  });
  if (!result.ok) return result;

  const reminders = await quietSoftDelete(supabase, {
    table: "user_reminders",
    userId: input.userId,
    match: { kind: "plan", source_id: String(input.id) },
  });
  if (!reminders.ok) {
    return {
      ok: false,
      message: "Program archived, but gym reminders could not be cleared.",
    };
  }
  return result;
}
