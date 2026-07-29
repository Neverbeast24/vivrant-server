import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson, todayDate } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const expenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["food", "fitness", "supplements", "wellness", "other"]),
  amount: z.coerce.number().min(0),
  spent_at: z.string().date().optional(),
});

/** List expenses. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("spent_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ expenses: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in the expense details.", 400);

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      amount: parsed.data.amount,
      spent_at: parsed.data.spent_at ?? todayDate(),
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "expense_added",
      entity: "expenses",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: { title: parsed.data.title, amount: parsed.data.amount },
    },
    supabase,
  );

  return jsonOk({ expense: data }, 201);
}
