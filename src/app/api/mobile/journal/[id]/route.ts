import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, parseIdParam, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

const journalSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  body: z.string().trim().min(1).max(8000),
  mood: z.coerce.number().int().min(1).max(5).optional().nullable(),
  entry_date: z.string().date().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id === null) return jsonError("Invalid note id.");

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) return jsonError("Add a note.");

  const entry_date = parsed.data.entry_date ?? new Date().toISOString().slice(0, 10);
  const title = parsed.data.title?.trim() || "Journal";
  const tags = normalizeTags(parsed.data.tags);
  const mood = parsed.data.mood ?? null;

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .update({
      entry_date,
      title,
      body: parsed.data.body,
      mood,
      tags,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  if (mood != null) {
    await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: entry_date,
        mood,
      },
      { onConflict: "user_id,checkin_date" },
    );
  }

  await writeAuditLog(
    { action: "journal_entry_updated", entity: "journal_entries", entityId: String(id) },
    supabase,
  );

  return jsonOk({ entry });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (id === null) return jsonError("Invalid note id.");

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    { action: "journal_entry_deleted", entity: "journal_entries", entityId: String(id) },
    supabase,
  );

  return jsonOk();
}
