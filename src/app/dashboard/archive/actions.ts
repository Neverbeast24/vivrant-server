"use server";

import { revalidatePath } from "next/cache";
import {
  archiveRecordsByIds,
  isArchiveTable,
  listArchivedRecords,
  parseArchiveIds,
  restoreArchivedRecord,
  restoreArchivedRecords,
} from "@/lib/archive";
import { writeExportBackup } from "@/lib/backup";
import { createClient } from "@/lib/supabase/server";

export async function restoreArchivedItem(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const result = await restoreArchivedRecord(supabase, { archiveId: id, userId: user.id });
  if (!result.ok) return result;

  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard");
  return result;
}

export async function archiveItems(table: string, ids: number[]) {
  if (!isArchiveTable(table)) return { ok: false, message: "Unknown item type." };
  const parsed = parseArchiveIds(ids);
  if (!parsed.length) return { ok: false, message: "Select at least one item." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  return archiveRecordsByIds(supabase, {
    table,
    ids: parsed,
    userId: user.id,
  });
}

export async function restoreArchivedItems(ids: number[]) {
  const parsed = parseArchiveIds(ids);
  if (!parsed.length) return { ok: false, message: "Select at least one item." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const result = await restoreArchivedRecords(supabase, {
    archiveIds: parsed,
    userId: user.id,
  });
  if (!result.ok) return result;
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard");
  return result;
}

export async function downloadMyBackup() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };

  const result = await writeExportBackup(supabase, user.id);
  return { ok: true as const, dump: result.dump };
}

export async function loadArchivedItems() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in.", items: [] };

  return listArchivedRecords(supabase, user.id);
}
