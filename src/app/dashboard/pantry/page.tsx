import type { Metadata } from "next";
import { PantryView } from "@/components/dashboard/pantry";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Pantry" };

export default async function PantryPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("pantry_items")
    .select("id, name, category, stock_level")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <PantryView items={data ?? []} />;
}
