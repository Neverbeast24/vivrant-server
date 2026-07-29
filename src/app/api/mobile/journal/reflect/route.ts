import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { generateJournalReflection } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("entry_date, title, body, mood")
    .eq("user_id", user.id)
    .gte("entry_date", weekStart.toISOString().slice(0, 10))
    .order("entry_date", { ascending: false })
    .limit(12);

  if (!entries?.length) return jsonError("Write a few entries first.");

  try {
    const context = await buildUserContext(user.id, { supabase });
    const tip = await generateJournalReflection(
      context,
      entries
        .map((e) => `${e.entry_date} \u00b7 ${e.title} (mood ${e.mood ?? "\u2014"})\n${e.body}`)
        .join("\n\n"),
    );

    await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: tip.title,
      body: tip.body,
      score: tip.score,
      source: "journal_reflect",
    });

    return jsonOk({ reflection: tip, tip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reflect.";
    return jsonError(message, 502);
  }
}
