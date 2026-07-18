import type { Metadata } from "next";
import { NutritionView } from "@/components/dashboard/nutrition";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("logged_at", { ascending: false })
    .limit(20);

  return <NutritionView meals={data ?? []} />;
}
