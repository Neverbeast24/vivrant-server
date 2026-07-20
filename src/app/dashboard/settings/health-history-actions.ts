"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { analyzeHealthHistory } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().min(min).max(max).nullable(),
  );

const historySchema = z.object({
  recorded_at: z.string().date(),
  weight_kg: optionalNumber(20, 400),
  height_cm: optionalNumber(50, 250),
  body_fat_pct: optionalNumber(3, 70),
  waist_cm: optionalNumber(40, 200),
  note: z.string().trim().max(300).optional(),
});

export async function addHealthHistoryEntry(formData: FormData) {
  const parsed = historySchema.safeParse({
    recorded_at: formData.get("recorded_at"),
    weight_kg: formData.get("weight_kg"),
    height_cm: formData.get("height_cm"),
    body_fat_pct: formData.get("body_fat_pct"),
    waist_cm: formData.get("waist_cm"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid history entry with at least one measurement." };
  }
  if (
    parsed.data.weight_kg == null &&
    parsed.data.height_cm == null &&
    parsed.data.body_fat_pct == null &&
    parsed.data.waist_cm == null
  ) {
    return { ok: false, message: "Add weight, height, body fat, or waist." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("health_history").insert({
    user_id: user.id,
    recorded_at: parsed.data.recorded_at,
    weight_kg: parsed.data.weight_kg,
    height_cm: parsed.data.height_cm,
    body_fat_pct: parsed.data.body_fat_pct,
    waist_cm: parsed.data.waist_cm,
    note: parsed.data.note || null,
    source: "manual",
  });
  if (error) return { ok: false, message: error.message };

  // Keep profile in sync when latest weight/height is logged.
  const profilePatch: Record<string, number> = {};
  if (parsed.data.weight_kg != null) profilePatch.weight_kg = parsed.data.weight_kg;
  if (parsed.data.height_cm != null) profilePatch.height_cm = parsed.data.height_cm;
  if (Object.keys(profilePatch).length) {
    await supabase.from("profiles").update(profilePatch).eq("user_id", user.id);
  }

  await writeAuditLog({
    action: "health_history_created",
    entity: "health_history",
    metadata: {
      recorded_at: parsed.data.recorded_at,
      weight_kg: parsed.data.weight_kg,
      height_cm: parsed.data.height_cm,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/gym");
  revalidatePath("/dashboard");
  return { ok: true, message: "Health history saved." };
}

export async function deleteHealthHistoryEntry(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("health_history")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "health_history_deleted",
    entity: "health_history",
    entityId: String(id),
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/gym");
  return { ok: true, message: "Entry removed." };
}

export async function analyzeHealthHistoryWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const insight = await analyzeHealthHistory(context);
    return { ok: true, message: "Health history insight ready.", insight };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not analyze health history.";
    return { ok: false, message };
  }
}
