import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pantry" };

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("pantry_items")
    .select("id, name, category, stock_level")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <PantryView items={data ?? []} />;
}
