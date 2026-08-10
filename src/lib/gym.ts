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

/** Turn slug-style labels (fat_loss) into readable text for UI. */
export function humanizeGymLabel(value: string) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match an AI/plan exercise name to a catalog demo (exact, then loose contains). */
export function findExerciseMatch(name: string, exercises: GymExercise[]) {
  const needle = name.toLowerCase().trim();
  if (!needle) return undefined;
  const exact = exercises.find((item) => item.name.toLowerCase() === needle);
  if (exact) return exact;
  const contained = exercises.find((item) => {
    const catalog = item.name.toLowerCase();
    return needle.includes(catalog) || catalog.includes(needle);
  });
  if (contained) return contained;
  // Strip common suffixes the model adds (" machine", " trainer") and retry.
  const stripped = needle
    .replace(/\b(machine|trainer|bike|climber)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped || stripped === needle) return undefined;
  return exercises.find((item) => {
    const catalog = item.name.toLowerCase();
    return catalog.includes(stripped) || stripped.includes(catalog.replace(/\b(machine|trainer)\b/g, "").trim());
  });
}
