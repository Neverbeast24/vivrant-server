"use server";

import { z } from "zod";
import { buildUserContext } from "@/lib/ai/context";
import { estimateMealMacros } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function estimateMealWithAi(formData: FormData) {
  const parsed = z
    .object({ description: z.string().trim().min(2).max(240) })
    .safeParse({ description: formData.get("description") });
  if (!parsed.success) {
    return { ok: false, message: "Describe the meal first (e.g. chicken rice bowl)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const estimate = await estimateMealMacros(parsed.data.description, context);
    return {
      ok: true,
      message: "Macros estimated — review and log the meal.",
      estimate,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not estimate this meal.";
    return { ok: false, message };
  }
}
