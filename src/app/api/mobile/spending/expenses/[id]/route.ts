import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson, parseIdParam } from "@/lib/mobile/http";
import { archiveRecord } from "@/lib/archive";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const expenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["food", "fitness", "supplements", "wellness", "other"]),
  amount: z.coerce.number().min(0),
  spent_at: z.string().date(),
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
  if (id == null) return jsonError("Invalid expense id.", 400);

  const body = await readJson(request);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in the expense details.", 400);

  const { data, error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "expense_updated",
      entity: "expenses",
      entityId: String(id),
      metadata: { title: parsed.data.title, amount: parsed.data.amount },
    },
    supabase,
  );

  return jsonOk({ expense: data });
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
  if (id == null) return jsonError("Invalid expense id.", 400);

  const result = await archiveRecord(supabase, {
    table: "expenses",
    id,
    userId: user.id,
    auditAction: "expense_deleted",
  });
  if (!result.ok) return jsonError(result.message, 500);
  return jsonOk();
}
