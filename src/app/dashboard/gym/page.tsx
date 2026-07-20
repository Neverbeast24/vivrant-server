import type { Metadata } from "next";
import { GymView } from "@/components/dashboard/gym";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Gym" };

export default async function GymPage() {
  const { supabase, user } = await requireUser();

  const [exercises, sessions, plans] = await Promise.all([
    supabase
      .from("gym_exercises")
      .select(
        "id, slug, name, muscle_group, equipment, difficulty, duration_seconds, demo_video_url, demo_thumbnail_url, cues",
      )
      .order("name"),
    supabase
      .from("gym_sessions")
      .select("id, title, focus, duration_minutes, calories_burned, exercises, notes, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(20),
    supabase
      .from("gym_plans")
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <GymView
      exercises={exercises.data ?? []}
      sessions={(sessions.data ?? []).map((row) => ({
        ...row,
        exercises: Array.isArray(row.exercises) ? row.exercises : [],
      }))}
      plans={(plans.data ?? []).map((row) => ({
        ...row,
        days: Array.isArray(row.days) ? row.days : [],
      }))}
    />
  );
}
