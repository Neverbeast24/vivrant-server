import type { Metadata } from "next";
import { GroceriesView } from "@/components/dashboard/groceries";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Groceries" };

export default async function GroceriesPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("grocery_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <GroceriesView items={data ?? []} />;
}
