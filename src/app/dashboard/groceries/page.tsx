import type { Metadata } from "next";
import { GroceriesView } from "@/components/dashboard/groceries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Groceries" };

export default async function GroceriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <GroceriesView items={data ?? []} />;
}
