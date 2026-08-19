import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { applyIdOrder, fetchListOrder } from "@/lib/reorder";

export const runtime = "nodejs";

const LOW_STOCK_THRESHOLD = 25;

const pantrySchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  stock_level: z.coerce.number().int().min(0).max(100),
});

/** GET ?low_stock=1, ?category= — list pantry items. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const lowStock = searchParams.get("low_stock");
  const category = searchParams.get("category");

  let query = supabase
    .from("pantry_items")
    .select("id, name, category, stock_level, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (lowStock === "1" || lowStock === "true") {
    query = query.lte("stock_level", LOW_STOCK_THRESHOLD);
  }
  if (category) {
    query = query.eq("category", category);
  }

  const [{ data, error }, listOrder] = await Promise.all([
    query,
    fetchListOrder(supabase, user.id),
  ]);
  if (error) return jsonError(error.message, 500);

  return jsonOk({ items: applyIdOrder(data ?? [], listOrder.pantry) });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = pantrySchema.safeParse(body);
  if (!parsed.success) return jsonError("Please fill in pantry details.", 400);

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      stock_level: parsed.data.stock_level,
    })
    .select("id, name, category, stock_level, created_at")
    .single();
  if (error) return jsonError(error.message, 500);

  return jsonOk({ item: data }, 201);
}
