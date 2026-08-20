"use server";

import { revalidatePath } from "next/cache";
import { listArchivedRecords, restoreArchivedRecord } from "@/lib/archive";
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

export async function downloadMyBackup() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };

  const result = await writeExportBackup(supabase, user.id);
  if (!result.ok) return { ok: false as const, message: result.message };
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
