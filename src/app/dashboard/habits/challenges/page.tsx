import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { syncChallengeProgress } from "@/lib/challenges/progress";
import { HabitsView } from "@/components/dashboard/habits";

export const metadata: Metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await syncChallengeProgress(supabase, user.id);

  const [{ data: habits }, { data: challenges }, { data: progress }, { data: logs }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("id, title, category, frequency")
        .eq("user_id", user.id)
        .eq("active", true),
      supabase
        .from("challenges")
        .select("id, title, description, metric, target_value, starts_on, ends_on")
        .eq("user_id", user.id)
        .order("ends_on", { ascending: false })
        .limit(20),
      supabase
        .from("challenge_progress")
        .select("challenge_id, current_value, completed")
        .eq("user_id", user.id),
      supabase
        .from("habit_logs")
        .select("habit_id, logged_on")
        .eq("user_id", user.id)
        .limit(50),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const progressMap = new Map(
    (progress ?? []).map((p) => [p.challenge_id, p] as const),
  );

  const challengeRows = (challenges ?? []).map((c) => {
    const p = progressMap.get(c.id);
    return {
      ...c,
      target_value: Number(c.target_value),
      current_value: Number(p?.current_value ?? 0),
      completed: Boolean(p?.completed),
    };
  });

  const enrichedHabits = (habits ?? []).map((habit) => ({
    id: habit.id,
    title: habit.title,
    category: habit.category,
    frequency: habit.frequency,
    doneToday: (logs ?? []).some((l) => l.habit_id === habit.id && l.logged_on === today),
    streak: 0,
  }));

  return (
    <HabitsView
      habits={enrichedHabits}
      bestStreak={0}
      section="challenges"
      challenges={challengeRows}
    />
  );
}
