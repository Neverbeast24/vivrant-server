import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { GROCERY_CATEGORY_ORDER } from "@/lib/groceries/categories";
import { estimateGroceryPrice, suggestGroceryCategory } from "@/lib/groceries/ph-price-catalog";
import { mapTypedLine, parseSpreadsheetPaste } from "@/lib/lists/parse-quick-list";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        quantity: z.string().trim().max(40).optional(),
        category: z.string().trim().optional(),
        estimated_price: z.coerce.number().min(0).optional(),
      }),
    )
    .optional(),
});

function resolveRow(input: {
  name: string;
  quantity?: string;
  category?: string;
  estimated_price?: number;
}) {
  const guessed = suggestGroceryCategory(input.name);
  const rawCategory = input.category || "other";
  const category =
    !GROCERY_CATEGORY_ORDER.includes(rawCategory) ||
    rawCategory === "other" ||
    (rawCategory === "produce" && guessed !== "produce" && guessed !== "other")
      ? guessed
      : rawCategory;
  const estimatedPrice =
    input.estimated_price != null && !Number.isNaN(input.estimated_price)
      ? Math.round(input.estimated_price)
      : estimateGroceryPrice(input.name, input.quantity, category);
  return {
    name: input.name.slice(0, 120),
    quantity: input.quantity?.slice(0, 40) || null,
    category,
    estimated_price: estimatedPrice,
  };
}

/** Bulk-add grocery items from a pasted list or row array. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Paste at least one item name.", 400);

  const fromText = parsed.data.text
    ? parseSpreadsheetPaste(parsed.data.text, 40).map((cells) =>
        mapTypedLine(cells, GROCERY_CATEGORY_ORDER),
      )
    : [];
  const fromItems = parsed.data.items ?? [];
  const rows = [
    ...fromText.map((row) => ({
      name: row.name,
      quantity: row.quantity,
      category: row.category,
      estimated_price: row.amount,
    })),
    ...fromItems,
  ].filter((row) => row.name?.trim());

  if (!rows.length) return jsonError("Paste at least one item name.", 400);

  const payload = rows.slice(0, 40).map((row) => ({
    user_id: user.id,
    ...resolveRow(row),
  }));

  const { data, error } = await supabase.from("grocery_items").insert(payload).select("*");
  if (error) return jsonError(error.message, 500);

  return jsonOk({ items: data ?? [] }, 201);
}
