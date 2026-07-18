import type { Metadata } from "next";
import { AiView } from "@/components/dashboard/ai";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "AI Insights" };

export default async function AiPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("id, title, body, score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <AiView insights={data ?? []} />;
}
