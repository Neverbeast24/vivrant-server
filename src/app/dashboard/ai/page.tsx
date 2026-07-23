import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AiView } from "@/components/dashboard/ai";

export const metadata: Metadata = { title: "Ask VIVRΛNT" };

export default async function AiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ai_chat_messages")
    .select("role, content, follow_up")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(40);

  const initialTurns = (data ?? []).map((row) => ({
    role: row.role as "user" | "viva",
    text: row.content,
    followUp: row.follow_up ?? undefined,
  }));

  return <AiView insights={[]} section="ask" initialTurns={initialTurns} />;
}
