"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { LIST_ORDER_MODULES, parseListOrder, type ListOrderModule } from "@/lib/reorder";

const saveSchema = z.object({
  module: z.enum(LIST_ORDER_MODULES),
  ids: z.array(z.coerce.number().int().positive()).max(200),
});

export async function saveListOrder(module: ListOrderModule, ids: number[]) {
  const parsed = saveSchema.safeParse({ module, ids });
  if (!parsed.success) return { ok: false, message: "Could not save that order." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: row } = await supabase
    .from("user_settings")
    .select("list_order")
    .eq("user_id", user.id)
    .maybeSingle();
  const current = parseListOrder(row?.list_order);
  const next = { ...current, [parsed.data.module]: parsed.data.ids };

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    list_order: next,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: "Could not save that order." };
  return { ok: true, message: "Order saved." };
}
