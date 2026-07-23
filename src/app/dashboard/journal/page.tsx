import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JournalView } from "@/components/dashboard/journal";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("journal_entries")
    .select("id, entry_date, title, body, mood, tags")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(40);

  return <JournalView entries={data ?? []} />;
}
