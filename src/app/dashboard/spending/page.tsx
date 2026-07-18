import type { Metadata } from "next";
import { SpendingView } from "@/components/dashboard/spending";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Spending" };

export default async function SpendingPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("spent_at", { ascending: false })
    .limit(20);

  return <SpendingView expenses={data ?? []} />;
}
