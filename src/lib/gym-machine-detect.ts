import { findExerciseMatch, type GymPlanDay, type GymPlanExercise } from "@/lib/gym";

export type MachineCatalogRow = {
  slug: string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty?: string | null;
  cues?: string | null;
};

export type MachineDetectionAlternative = {
  machine: string;
  demo_slug: string | null;
  why: string;
};

export type MachineDetection = {
  found: boolean;
  machine: string;
  demo_slug: string | null;
  confidence: number;
  why: string;
  how_to_use: string;
  sets: string;
  muscle_group: string;
  notes: string;
  alternatives: MachineDetectionAlternative[];
};

export function formatMachineCatalogForAi(rows: MachineCatalogRow[]): string {
  return rows
    .map(
      (row) =>
        `${row.name} | ${row.slug} | ${row.muscle_group} | ${row.equipment} | ${row.difficulty ?? "beginner"}`,
    )
    .join("\n");
}

export function resolveDetectedMachine<T extends { slug: string; name: string }>(
  catalog: T[],
  guess: { slug?: string | null; name?: string | null },
): T | null {
  const slug = String(guess.slug ?? "")
    .trim()
    .toLowerCase();
  if (slug) {
    const bySlug = catalog.find((item) => item.slug.toLowerCase() === slug);
    if (bySlug) return bySlug;
  }
  const name = String(guess.name ?? "").trim();
  return findExerciseMatch(name, catalog) ?? null;
}

export function appendNamedExerciseToPlanDay(
  day: GymPlanDay,
  exercise: GymPlanExercise,
  max = 6,
): GymPlanDay {
  const exercises = day.exercises ?? [];
  const name = exercise.name.trim().toLowerCase();
  if (!name || exercises.length >= max) return day;
  if (exercises.some((item) => item.name.trim().toLowerCase() === name)) return day;
  return { ...day, exercises: [...exercises, exercise] };
}

export function appendNamedExerciseToPlanDays(
  days: GymPlanDay[],
  dayIndex: number,
  exercise: GymPlanExercise,
  max = 6,
): GymPlanDay[] {
  if (dayIndex < 0 || dayIndex >= days.length) return days;
  return days.map((day, index) =>
    index === dayIndex ? appendNamedExerciseToPlanDay(day, exercise, max) : day,
  );
}

function asText(value: unknown, fallback: string, max: number) {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, max);
}

export function sanitizeMachineDetection(
  raw: {
    found?: boolean;
    machine?: string;
    demo_slug?: string | null;
    confidence?: number;
    why?: string;
    how_to_use?: string;
    sets?: string;
    muscle_group?: string;
    notes?: string;
    alternatives?: unknown;
  },
  catalog: MachineCatalogRow[],
): MachineDetection {
  const matched = resolveDetectedMachine(catalog, {
    slug: raw.demo_slug,
    name: raw.machine,
  });
  const found = Boolean(raw.found) && Boolean(matched || String(raw.machine ?? "").trim());
  const alternativesRaw = Array.isArray(raw.alternatives) ? raw.alternatives : [];
  const alternatives: MachineDetectionAlternative[] = [];
  const seen = new Set<string>();
  for (const row of alternativesRaw) {
    const item = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const altMatch = resolveDetectedMachine(catalog, {
      slug: item.demo_slug != null ? String(item.demo_slug) : null,
      name: item.machine != null ? String(item.machine) : null,
    });
    if (!altMatch) continue;
    const key = altMatch.slug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    alternatives.push({
      machine: altMatch.name.slice(0, 80),
      demo_slug: altMatch.slug,
      why: asText(item.why, "Similar machine if the photo is unclear.", 180),
    });
    if (alternatives.length >= 3) break;
  }

  return {
    found,
    machine: asText(matched?.name ?? raw.machine, found ? "Gym machine" : "Not a gym machine", 80),
    demo_slug: matched?.slug ?? null,
    confidence: Math.min(100, Math.max(0, Math.round(Number(raw.confidence ?? (found ? 60 : 20))))),
    why: asText(
      raw.why,
      found ? "Matches the equipment in your photo." : "The photo does not look like a gym machine from the catalog.",
      220,
    ),
    how_to_use: asText(
      raw.how_to_use,
      found ? "Use a light warm-up set, then work with control." : "Try a clearer photo of the whole machine.",
      280,
    ),
    sets: asText(raw.sets, found ? "3 x 10" : "", 40),
    muscle_group: asText(matched?.muscle_group ?? raw.muscle_group, "", 40),
    notes: asText(raw.notes, "", 220),
    alternatives,
  };
}
