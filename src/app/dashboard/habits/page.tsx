import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HabitsView } from "@/components/dashboard/habits";
import { parseListOrder } from "@/lib/reorder";

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
  const [{ data: habits }, { data: logs }, { data: challenges }, { data: progress }, { data: settings }] =
    await Promise.all([
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
    supabase
      .from("challenges")
      .select("id, title, description, metric, target_value, starts_on, ends_on")
      .eq("user_id", user.id)
      .order("ends_on", { ascending: false })
      .limit(8),
    supabase
      .from("challenge_progress")
      .select("challenge_id, current_value, completed")
      .eq("user_id", user.id),
    supabase.from("user_settings").select("list_order").eq("user_id", user.id).maybeSingle(),
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
  const progressMap = new Map((progress ?? []).map((p) => [p.challenge_id, p] as const));
  const challengeRows = (challenges ?? []).map((c) => {
    const p = progressMap.get(c.id);
    return {
      ...c,
      target_value: Number(c.target_value),
      current_value: Number(p?.current_value ?? 0),
      completed: Boolean(p?.completed),
    };
  });

  return (
    <HabitsView
      habits={enriched}
      bestStreak={bestStreak}
      section="overview"
      challenges={challengeRows}
      listOrder={parseListOrder(settings?.list_order).habits ?? []}
    />
  );
}
