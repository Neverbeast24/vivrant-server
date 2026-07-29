export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateHealthInsight } from "@/lib/ai/gemini";

/** Generate + save a fresh AI health insight, and notify the member. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const context = await buildUserContext(user.id, { supabase });
    const insight = await generateHealthInsight(context);

    const { error } = await supabase.from("ai_recommendations").insert({
      user_id: user.id,
      title: insight.title,
      body: insight.body,
      score: insight.score,
      source: "insight",
    });
    if (error) return jsonError(error.message, 500);

    await writeAuditLog(
      {
        action: "ai_insight_generated",
        entity: "ai_recommendations",
        metadata: { title: insight.title, score: insight.score },
      },
      supabase,
    );

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "New VIVRΛNT insight",
      body: insight.title,
      href: "/dashboard/ai/insights",
      is_read: false,
    });

    return jsonOk({ insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini could not generate an insight.";
    return jsonError(message, 500);
  }
}
