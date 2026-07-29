export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { askViva } from "@/lib/ai/gemini";

const chatSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

/** Chat history with VIVRΛNT (most recent 100 messages, oldest first). */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("id, role, content, follow_up, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Ask a short question (at least a few words).", 400);
  }

  try {
    const context = await buildUserContext(user.id, { supabase });
    const reply = await askViva(context, parsed.data.question);

    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: parsed.data.question,
    });

    const { data: message, error } = await supabase
      .from("ai_chat_messages")
      .insert({
        user_id: user.id,
        role: "viva",
        content: reply.answer,
        follow_up: reply.follow_up ?? null,
      })
      .select("id, role, content, follow_up, created_at")
      .single();
    if (error) return jsonError(error.message, 500);

    return jsonOk({ message, reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "VIVRΛNT could not answer right now.";
    return jsonError(message, 500);
  }
}
