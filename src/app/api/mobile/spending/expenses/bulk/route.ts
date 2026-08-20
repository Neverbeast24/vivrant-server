import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson, todayDate } from "@/lib/mobile/http";
import { mapTypedLine, parseSpreadsheetPaste } from "@/lib/lists/parse-quick-list";

export const runtime = "nodejs";

const CATEGORIES = ["food", "fitness", "supplements", "wellness", "other"] as const;

const bodySchema = z.object({
  text: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        category: z.enum(CATEGORIES).optional(),
        amount: z.coerce.number().min(0),
        spent_at: z.string().date().optional(),
      }),
    )
    .optional(),
});

/** Bulk-add expenses from a pasted list. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Paste lines like: Coffee, 120  or  Gym, 500, fitness", 400);
  }

  const fromText = parsed.data.text
    ? parseSpreadsheetPaste(parsed.data.text, 40)
        .map((cells) => mapTypedLine(cells, CATEGORIES))
        .filter((row) => row.name && row.amount != null)
        .map((row) => ({
          title: row.name,
          category: CATEGORIES.includes(row.category as (typeof CATEGORIES)[number])
            ? (row.category as (typeof CATEGORIES)[number])
            : "other",
          amount: row.amount as number,
        }))
    : [];
  const rows = [...fromText, ...(parsed.data.items ?? [])];
  if (!rows.length) {
    return jsonError("Paste lines like: Coffee, 120  or  Gym, 500, fitness", 400);
  }

  const today = todayDate();
  const payload = rows.slice(0, 40).map((row) => ({
    user_id: user.id,
    title: row.title.slice(0, 120),
    category: row.category ?? "other",
    amount: row.amount,
    spent_at: "spent_at" in row && row.spent_at ? row.spent_at : today,
  }));

  const { data, error } = await supabase.from("expenses").insert(payload).select("*");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ expenses: data ?? [] }, 201);
}
