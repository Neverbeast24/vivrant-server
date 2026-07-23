import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HabitsView } from "@/components/dashboard/habits";

export const metadata: Metadata = { title: "Habits" };

function streakFor(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, category, frequency")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, logged_on")
      .eq("user_id", user.id)
      .order("logged_on", { ascending: false })
      .limit(400),
  ]);

  const logRows = logs ?? [];
  const enriched = (habits ?? []).map((habit) => {
    const dates = logRows.filter((l) => l.habit_id === habit.id).map((l) => l.logged_on);
    return {
      id: habit.id,
      title: habit.title,
      category: habit.category,
      frequency: habit.frequency,
      doneToday: dates.includes(today),
      streak: streakFor(dates),
    };
  });
  const bestStreak = enriched.reduce((m, h) => Math.max(m, h.streak), 0);

  return <HabitsView habits={enriched} bestStreak={bestStreak} section="overview" />;
}
