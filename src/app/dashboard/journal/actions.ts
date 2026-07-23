"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateJournalReflection, generateMindfulnessTip } from "@/lib/ai/gemini";
import { syncGoalProgress } from "@/lib/goals/progress";
import { createClient } from "@/lib/supabase/server";

const journalSchema = z.object({
  entry_date: z.string().date(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(8000),
  mood: z.coerce.number().int().min(1).max(5).optional().nullable(),
  tags: z.string().trim().max(200).optional().nullable(),
});

export async function saveJournalEntry(formData: FormData) {
  const parsed = journalSchema.safeParse({
    entry_date: formData.get("entry_date") || new Date().toISOString().slice(0, 10),
    title: formData.get("title"),
    body: formData.get("body"),
    mood: formData.get("mood") || null,
    tags: formData.get("tags") || null,
  });
  if (!parsed.success) return { ok: false, message: "Add a title and note." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    entry_date: parsed.data.entry_date,
    title: parsed.data.title,
    body: parsed.data.body,
    mood: parsed.data.mood,
    tags,
  });
  if (error) return { ok: false, message: error.message };

  if (parsed.data.mood != null) {
    await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: parsed.data.entry_date,
        mood: parsed.data.mood,
      },
      { onConflict: "user_id,checkin_date" },
    );
  }

  await syncGoalProgress(supabase, user.id);
  await writeAuditLog({
    action: "journal_entry_created",
    entity: "journal_entries",
    metadata: { title: parsed.data.title },
  });

  revalidatePath("/dashboard/journal");
  revalidatePath("/dashboard/mindfulness");
  revalidatePath("/dashboard");
  return { ok: true, message: "Journal entry saved." };
}

export async function deleteJournalEntry(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/journal");
  return { ok: true, message: "Entry removed." };
}

export async function reflectOnJournal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("entry_date, title, body, mood")
    .eq("user_id", user.id)
    .gte("entry_date", weekStart.toISOString().slice(0, 10))
    .order("entry_date", { ascending: false })
    .limit(12);

  if (!entries?.length) return { ok: false, message: "Write a few entries first." };

  try {
    const context = await buildUserContext(user.id);
    const tip = await generateJournalReflection(
      context,
      entries
        .map((e) => `${e.entry_date} · ${e.title} (mood ${e.mood ?? "—"})\n${e.body}`)
        .join("\n\n"),
    );
    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: tip.title,
      body: tip.body,
      score: tip.score,
      source: "journal_reflect",
    });
    revalidatePath("/dashboard/journal");
    return { ok: true, message: "Reflection ready.", tip };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not reflect.",
    };
  }
}

const moodSchema = z.object({
  mood: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function logMood(formData: FormData) {
  const parsed = moodSchema.safeParse({
    mood: formData.get("mood"),
    note: formData.get("note") || null,
  });
  if (!parsed.success) return { ok: false, message: "Pick a mood from 1–5." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: today,
      mood: parsed.data.mood,
      note: parsed.data.note,
    },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) return { ok: false, message: error.message };

  await syncGoalProgress(supabase, user.id);
  revalidatePath("/dashboard/mindfulness");
  revalidatePath("/dashboard");
  return { ok: true, message: "Mood saved." };
}

export async function coachMindfulness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const tip = await generateMindfulnessTip(context);
    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: tip.title,
      body: tip.body,
      score: tip.score,
      source: "mindfulness",
    });
    revalidatePath("/dashboard/mindfulness");
    return { ok: true, message: "Calm tip ready.", tip };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not generate tip.",
    };
  }
}
