"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildUserContext } from "@/lib/ai/context";
import {
  askViva,
  draftReminder,
  generateHealthInsight,
} from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

async function requireSignedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null };
  return { supabase, user };
}

export async function generateInsight(_formData?: FormData) {
  void _formData;
  const { supabase, user } = await requireSignedIn();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const insight = await generateHealthInsight(context);

    const { error } = await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: insight.title,
      body: insight.body,
      score: insight.score,
    });
    if (error) return { ok: false, message: error.message };

    revalidatePath("/dashboard/ai");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "New Gemini insight generated.",
      insight,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini could not generate an insight.";
    return { ok: false, message };
  }
}

export async function askVivaQuestion(formData: FormData) {
  const parsed = z
    .object({ question: z.string().trim().min(3).max(500) })
    .safeParse({ question: formData.get("question") });
  if (!parsed.success) {
    return { ok: false, message: "Ask a short question (at least a few words)." };
  }

  const { user } = await requireSignedIn();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const reply = await askViva(context, parsed.data.question);
    return {
      ok: true,
      message: "VIVA answered.",
      reply,
      question: parsed.data.question,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "VIVA could not answer right now.";
    return { ok: false, message };
  }
}

export async function generateReminderDraft(_formData?: FormData) {
  void _formData;
  const { user } = await requireSignedIn();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const reminder = await draftReminder(context);
    return {
      ok: true,
      message: "Reminder draft ready. Connect Firebase VAPID to send it as a push.",
      reminder,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not draft a reminder.";
    return { ok: false, message };
  }
}
