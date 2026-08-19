import { requireUser } from "@/lib/auth/roles";
import {
  buildRoutineScaling,
  pickGoalTargetDate,
  type RoutineScaling,
} from "@/lib/health/body-metrics";
import { enrichGymPlanDays, hydrateGymPlan, isMachineGear, type GymExercise, type GymPlan, type GymSession } from "@/lib/gym";
import { loadGymProgramDraft } from "@/lib/gym-plan-generate";
import type { GymProgramDraft } from "@/lib/gym-program-draft";

const emptyGymData = {
  exercises: [] as GymExercise[],
  sessions: [] as GymSession[],
  plans: [] as GymPlan[],
  draft: null as GymProgramDraft | null,
  machineCount: 0,
  demoCount: 0,
  totalMinutes: 0,
  totalCalories: 0,
  scaling: null as RoutineScaling | null,
};

export async function loadGymData() {
  const { supabase, user } = await requireUser();

  try {
    const [exercises, sessions, plans, profile, goals, draft] = await Promise.all([
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
      supabase
        .from("profiles")
        .select("height_cm, weight_kg, goal_weight_kg")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("health_goals")
        .select("category, unit, target_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(12),
      loadGymProgramDraft(supabase, user.id).catch(() => null),
    ]);

    if (exercises.error) {
      console.error("[gym] gym_exercises:", exercises.error.message);
    }
    if (sessions.error) {
      console.error("[gym] gym_sessions:", sessions.error.message);
    }
    if (plans.error) {
      console.error("[gym] gym_plans:", plans.error.message);
    }

    const exerciseRows = (exercises.data ?? []) as GymExercise[];
    const sessionRows = ((sessions.data ?? []) as GymSession[]).map((row) => ({
      ...row,
      exercises: Array.isArray(row.exercises) ? row.exercises : [],
    }));
    const planRows = ((plans.data ?? []) as GymPlan[]).map((row) => {
      const hydrated = hydrateGymPlan(row);
      return { ...hydrated, days: enrichGymPlanDays(hydrated.days, exerciseRows) };
    });

    const scaling = buildRoutineScaling({
      height_cm: profile.data?.height_cm ?? null,
      weight_kg: profile.data?.weight_kg ?? null,
      goal_weight_kg: profile.data?.goal_weight_kg ?? null,
      target_date: pickGoalTargetDate(goals.data),
    });

    return {
      exercises: exerciseRows,
      sessions: sessionRows,
      plans: planRows,
      draft,
      machineCount: exerciseRows.filter((item) => isMachineGear(item.equipment)).length,
      demoCount: exerciseRows.filter((item) => !isMachineGear(item.equipment)).length,
      totalMinutes: sessionRows.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0),
      totalCalories: sessionRows.reduce((sum, row) => sum + (row.calories_burned ?? 0), 0),
      scaling,
    };
  } catch (error) {
    console.error("[gym] loadGymData failed:", error);
    return emptyGymData;
  }
}
