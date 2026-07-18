import type { Metadata } from "next";
import { SpendingView } from "@/components/dashboard/spending";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Spending" };

export default async function SpendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user!.id)
    .order("spent_at", { ascending: false })
    .limit(20);

  return <SpendingView expenses={data ?? []} />;
}
