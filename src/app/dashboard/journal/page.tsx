import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadWellnessPulse } from "@/app/dashboard/wellness/data";
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
    .order("updated_at", { ascending: false })
    .limit(80);

  const pulse = await loadWellnessPulse();

  return <JournalView entries={data ?? []} pulse={pulse} />;
}
