export type GymExercise = {
  id: number;
  slug: string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  duration_seconds: number;
  demo_video_url: string;
  demo_thumbnail_url: string | null;
  cues: string | null;
};

export type GymSession = {
  id: number;
  title: string;
  focus: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  exercises: { name?: string; sets?: string }[] | null;
  notes: string | null;
  logged_at: string;
};

export type GymPlan = {
  id: number;
  title: string;
  focus: string;
  level: string;
  days_per_week: number;
  summary: string | null;
  days: {
    day: string;
    focus: string;
    exercises: { name: string; sets: string; rest: string; notes?: string }[];
  }[];
  created_at: string;
};

export function isMachineGear(equipment: string) {
  return equipment === "machine" || equipment === "cable" || equipment === "cardio_machine";
}
