import type { Metadata } from "next";
import { ReportsView } from "@/components/dashboard/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [checkins, meals, workouts, expenses] = await Promise.all([
    supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("nutrition_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("workout_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("expenses").select("amount").eq("user_id", user!.id),
  ]);

  const expensesTotal = (expenses.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  return (
    <ReportsView
      checkins={checkins.count ?? 0}
      meals={meals.count ?? 0}
      workouts={workouts.count ?? 0}
      expensesTotal={expensesTotal}
    />
  );
}
