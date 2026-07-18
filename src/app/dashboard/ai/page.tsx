import type { Metadata } from "next";
import { AiView } from "@/components/dashboard/ai";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "AI Insights" };

export default async function AiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("id, title, body, score, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <AiView insights={data ?? []} />;
}
