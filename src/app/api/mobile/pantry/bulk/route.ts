import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { groceryToPantryCategory, isPantryCategory } from "@/app/dashboard/pantry/shared";
import { suggestGroceryCategory } from "@/lib/groceries/ph-price-catalog";
import { mapTypedLine, parseSpreadsheetPaste } from "@/lib/lists/parse-quick-list";

export const runtime = "nodejs";

const PANTRY_CATS = [
  "vegetables",
  "fruits",
  "protein",
  "dairy",
  "grains",
  "snacks",
  "drinks",
  "condiments",
  "frozen",
  "other",
];

const bodySchema = z.object({
  text: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        category: z.string().trim().optional(),
        stock_level: z.coerce.number().int().min(0).max(100).optional(),
      }),
    )
    .optional(),
});

function resolveRow(input: { name: string; category?: string; stock_level?: number }) {
  const guessed = groceryToPantryCategory(suggestGroceryCategory(input.name));
  const category = input.category && isPantryCategory(input.category) ? input.category : guessed;
  const stock =
    input.stock_level != null && Number.isFinite(input.stock_level)
      ? Math.min(100, Math.max(0, Math.round(input.stock_level)))
      : 50;
  return { name: input.name.slice(0, 120), category, stock_level: stock };
}

/** Bulk-add pantry items from a pasted list or row array. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Paste at least one item name.", 400);

  const fromText = parsed.data.text
    ? parseSpreadsheetPaste(parsed.data.text, 40).map((cells) => mapTypedLine(cells, PANTRY_CATS))
    : [];
  const rows = [
    ...fromText.map((row) => ({
      name: row.name,
      category: row.category,
      stock_level: row.amount,
    })),
    ...(parsed.data.items ?? []),
  ].filter((row) => row.name?.trim());

  if (!rows.length) return jsonError("Paste at least one item name.", 400);

  const payload = rows.slice(0, 40).map((row) => ({
    user_id: user.id,
    ...resolveRow(row),
  }));

  const { data, error } = await supabase
    .from("pantry_items")
    .insert(payload)
    .select("id, name, category, stock_level, created_at");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ items: data ?? [] }, 201);
}
