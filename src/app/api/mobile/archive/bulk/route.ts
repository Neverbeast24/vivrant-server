import {
  archiveRecordsByIds,
  isArchiveTable,
  parseArchiveIds,
  restoreArchivedRecords,
} from "@/lib/archive";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;
  const body = (await readJson(request)) as {
    op?: unknown;
    entity?: unknown;
    ids?: unknown;
  } | null;

  const op = body?.op === "restore" ? "restore" : body?.op === "archive" ? "archive" : null;
  if (!op) return jsonError("Choose archive or restore.", 400);

  const ids = parseArchiveIds(body?.ids);
  if (!ids.length) return jsonError("Select at least one item.", 400);

  if (op === "restore") {
    const result = await restoreArchivedRecords(supabase, {
      archiveIds: ids,
      userId: user.id,
    });
    if (!result.ok) return jsonError(result.message, 400);
    return jsonOk({ message: result.message, count: ids.length });
  }

  const entity = typeof body?.entity === "string" ? body.entity : "";
  if (!isArchiveTable(entity)) return jsonError("Unknown item type.", 400);

  const result = await archiveRecordsByIds(supabase, {
    table: entity,
    ids,
    userId: user.id,
  });
  if (!result.ok) return jsonError(result.message, 400);
  return jsonOk({ message: result.message, count: ids.length });
}
