import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { mapTypedLine, parseSpreadsheetPaste } from "@/lib/lists/parse-quick-list";

export const runtime = "nodejs";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

const bodySchema = z.object({
  text: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        meal_name: z.string().trim().min(1).max(120),
        meal_type: z.enum(MEAL_TYPES).optional(),
        calories: z.coerce.number().int().min(0).optional(),
      }),
    )
    .optional(),
});

/** Bulk-log meals from a pasted list. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Paste at least one meal name.", 400);

  const fromText = parsed.data.text
    ? parseSpreadsheetPaste(parsed.data.text, 20)
        .map((cells) => mapTypedLine(cells, MEAL_TYPES))
        .filter((row) => row.name)
        .map((row) => ({
          meal_name: row.name,
          meal_type: MEAL_TYPES.includes(row.category as (typeof MEAL_TYPES)[number])
            ? (row.category as (typeof MEAL_TYPES)[number])
            : "snack",
          calories: row.amount != null ? Math.round(row.amount) : undefined,
        }))
    : [];
  const rows = [...fromText, ...(parsed.data.items ?? [])];
  if (!rows.length) return jsonError("Paste at least one meal name.", 400);

  const payload = rows.slice(0, 20).map((row) => ({
    user_id: user.id,
    meal_name: row.meal_name.slice(0, 120),
    meal_type: row.meal_type ?? "snack",
    calories: row.calories ?? null,
  }));

  const { data, error } = await supabase.from("nutrition_logs").insert(payload).select("*");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ meals: data ?? [] }, 201);
}
