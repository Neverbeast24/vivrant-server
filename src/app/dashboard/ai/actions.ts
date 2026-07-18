"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function generateInsight(_formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("ai_recommendations").insert({
    user_id: user.id,
    title: "Protect your morning rhythm",
    body: "Your energy is strongest after morning walks. Tomorrow’s plan now protects that rhythm.",
    score: 84,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/ai");
  return { ok: true, message: "New insight generated." };
}
