import type { Metadata } from "next";
import { MovementView } from "@/components/dashboard/movement";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Movement" };

export default async function MovementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("logged_at", { ascending: false })
    .limit(20);

  return <MovementView workouts={data ?? []} />;
}
