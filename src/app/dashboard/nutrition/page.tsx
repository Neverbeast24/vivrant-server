import type { Metadata } from "next";
import { NutritionView } from "@/components/dashboard/nutrition";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(20);

  return <NutritionView meals={data ?? []} />;
}
