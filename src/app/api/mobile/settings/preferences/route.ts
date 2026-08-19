export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { parseListOrder } from "@/lib/reorder";

const bodySchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications_enabled: z.coerce.boolean(),
  weekly_report_enabled: z.coerce.boolean(),
  timezone: z.string().min(1),
});

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return jsonOk({ settings: settings ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const json = await readJson(request);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid settings.", 400);
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  return jsonOk({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const json = await readJson(request);
  const parsed = z
    .object({
      module: z.enum(["groceries", "pantry", "habits", "goals", "reminders"]),
      ids: z.array(z.coerce.number().int().positive()).max(200),
    })
    .safeParse(json);
  if (!parsed.success) return jsonError("Could not save that order.", 400);

  const { data: row } = await supabase
    .from("user_settings")
    .select("list_order")
    .eq("user_id", user.id)
    .maybeSingle();
  const next = { ...parseListOrder(row?.list_order), [parsed.data.module]: parsed.data.ids };

  const { data: settings, error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      list_order: next,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) return jsonError("Could not save that order.", 400);
  return jsonOk({ settings });
}
