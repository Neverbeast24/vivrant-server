"use server";

import { buildUserContext } from "@/lib/ai/context";
import { coachSpending } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function coachSpendingWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const advice = await coachSpending(context);
    return { ok: true, message: "Budget coach tip ready.", advice };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not coach spending right now.";
    return { ok: false, message };
  }
}
