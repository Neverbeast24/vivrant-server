import { requireUser } from "@/lib/auth/roles";
import { isMachineGear, type GymExercise, type GymPlan, type GymSession } from "@/components/dashboard/gym-parts";

export async function loadGymData() {
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
      .limit(30),
    supabase
      .from("gym_plans")
      .select("id, title, focus, level, days_per_week, summary, days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const exerciseRows = (exercises.data ?? []) as GymExercise[];
  const sessionRows = ((sessions.data ?? []) as GymSession[]).map((row) => ({
    ...row,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
  }));
  const planRows = ((plans.data ?? []) as GymPlan[]).map((row) => ({
    ...row,
    days: Array.isArray(row.days) ? row.days : [],
  }));

  return {
    exercises: exerciseRows,
    sessions: sessionRows,
    plans: planRows,
    machineCount: exerciseRows.filter((item) => isMachineGear(item.equipment)).length,
    demoCount: exerciseRows.filter((item) => !isMachineGear(item.equipment)).length,
    totalMinutes: sessionRows.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0),
    totalCalories: sessionRows.reduce((sum, row) => sum + (row.calories_burned ?? 0), 0),
  };
}
