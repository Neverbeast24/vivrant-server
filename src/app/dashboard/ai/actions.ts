"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
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
      source: "insight",
    });
    if (error) return { ok: false, message: error.message };

    await writeAuditLog({
      action: "ai_insight_generated",
      entity: "ai_recommendations",
      metadata: { title: insight.title, score: insight.score },
    });

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "New VIVRΛNT insight",
      body: insight.title,
      href: "/dashboard/ai/insights",
      is_read: false,
    });

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

  const { supabase, user } = await requireSignedIn();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const reply = await askViva(context, parsed.data.question);

    await supabase.from("ai_chat_messages").insert([
      {
        user_id: user.id,
        role: "user",
        content: parsed.data.question,
      },
      {
        user_id: user.id,
        role: "viva",
        content: reply.answer,
        follow_up: reply.follow_up ?? null,
      },
    ]);

    revalidatePath("/dashboard/ai");
    return {
      ok: true,
      message: "VIVRΛNT answered.",
      reply,
      question: parsed.data.question,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "VIVRΛNT could not answer right now.";
    return { ok: false, message };
  }
}

/** @deprecated Prefer draftAndSaveReminder — kept for compatibility. */
export async function generateReminderDraft(_formData?: FormData) {
  void _formData;
  const { user } = await requireSignedIn();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const reminder = await draftReminder(context);
    return {
      ok: true,
      message: "Reminder draft ready — save it from the Reminders page.",
      reminder,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not draft a reminder.";
    return { ok: false, message };
  }
}
