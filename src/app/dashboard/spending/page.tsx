import type { Metadata } from "next";
import { SpendingView } from "@/components/dashboard/spending";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Spending" };

export default async function SpendingPage() {
  const { supabase, user } = await requireUser();
  const [expensesRes, profileRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("spent_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("monthly_health_budget")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <SpendingView
      expenses={expensesRes.data ?? []}
      monthlyBudget={Number(profileRes.data?.monthly_health_budget ?? 2000)}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
