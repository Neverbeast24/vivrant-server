import type { Metadata } from "next";
import { NutritionSheet } from "@/components/dashboard/nutrition-sheet";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Meal sheet" };

export default async function NutritionSheetPage() {
  const { supabase, user } = await requireUser();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", dayStart.toISOString())
    .order("logged_at", { ascending: false })
    .limit(50);

  return <NutritionSheet meals={data ?? []} />;
}
