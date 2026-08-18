import type { Metadata } from "next";
import { SpendingLog } from "@/components/dashboard/spending";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Log expense" };

export default async function SpendingLogPage() {
  const { supabase, user } = await requireUser();

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [expensesRes, profileRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("spent_at", monthStartIso)
      .order("spent_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("monthly_health_budget")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <SpendingLog
      today={new Date().toISOString().slice(0, 10)}
      expenses={expensesRes.data ?? []}
      monthlyBudget={Number(profileRes.data?.monthly_health_budget ?? 2000)}
    />
  );
}
