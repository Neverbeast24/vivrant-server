import { describe, expect, it } from "vitest";
import {
  appendNamedExerciseToPlanDay,
  appendNamedExerciseToPlanDays,
  formatMachineCatalogForAi,
  resolveDetectedMachine,
  sanitizeMachineDetection,
} from "./gym-machine-detect";

const catalog = [
  {
    slug: "leg-press",
    name: "Leg Press Machine",
    muscle_group: "legs",
    equipment: "machine",
    difficulty: "beginner",
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    muscle_group: "back",
    equipment: "cable",
    difficulty: "beginner",
  },
  {
    slug: "leg-extension",
    name: "Leg Extension",
    muscle_group: "legs",
    equipment: "machine",
    difficulty: "beginner",
  },
];

describe("resolveDetectedMachine", () => {
  it("matches catalog slugs first", () => {
    expect(resolveDetectedMachine(catalog, { slug: "LAT-PULLDOWN", name: "Something else" })?.slug).toBe(
      "lat-pulldown",
    );
  });

  it("falls back to a loose name match", () => {
    expect(resolveDetectedMachine(catalog, { slug: "unknown", name: "leg press" })?.slug).toBe(
      "leg-press",
    );
  });
});

describe("sanitizeMachineDetection", () => {
  it("pins the match to the catalog and drops unknown alternatives", () => {
    const result = sanitizeMachineDetection(
      {
        found: true,
        machine: "Leg press",
        demo_slug: "leg-press",
        confidence: 91.2,
        why: "Plate-loaded sled with a back pad.",
        how_to_use: "Feet mid-platform, press without locking out.",
        sets: "3 x 12",
        alternatives: [
          { machine: "Leg extension", demo_slug: "leg-extension", why: "If this is a seated knee-extension stack." },
          { machine: "Made-up machine", demo_slug: "nope", why: "Ignore me." },
        ],
      },
      catalog,
    );
    expect(result.demo_slug).toBe("leg-press");
    expect(result.machine).toBe("Leg Press Machine");
    expect(result.confidence).toBe(91);
    expect(result.alternatives.map((item) => item.demo_slug)).toEqual(["leg-extension"]);
  });

  it("keeps found false when the photo is not equipment", () => {
    const result = sanitizeMachineDetection({ found: false, machine: "", confidence: 12 }, catalog);
    expect(result.found).toBe(false);
    expect(result.demo_slug).toBeNull();
  });
});

describe("appendNamedExerciseToPlanDay", () => {
  const day = {
    day: "Monday · Legs",
    focus: "Legs",
    exercises: [{ name: "Leg Press Machine", sets: "3 x 10", rest: "60s" }],
  };

  it("appends a new named move", () => {
    const next = appendNamedExerciseToPlanDay(day, {
      name: "Leg Extension",
      sets: "3 x 12",
      rest: "60s",
    });
    expect(next.exercises.map((item) => item.name)).toEqual(["Leg Press Machine", "Leg Extension"]);
  });

  it("skips duplicates and a full day", () => {
    expect(
      appendNamedExerciseToPlanDay(day, { name: "leg press machine", sets: "3 x 8", rest: "90s" }).exercises,
    ).toHaveLength(1);
    const full = {
      ...day,
      exercises: Array.from({ length: 6 }, (_, i) => ({
        name: `Move ${i + 1}`,
        sets: "3 x 10",
        rest: "60s",
      })),
    };
    expect(appendNamedExerciseToPlanDay(full, { name: "Leg Extension", sets: "3 x 10", rest: "60s" }).exercises).toHaveLength(
      6,
    );
  });

  it("updates one day in a program", () => {
    const days = appendNamedExerciseToPlanDays(
      [
        day,
        { day: "Wednesday · Push", focus: "Push", exercises: [{ name: "Chest Press", sets: "3 x 10", rest: "60s" }] },
      ],
      1,
      { name: "Pec Deck", sets: "3 x 12", rest: "60s" },
    );
    expect(days[0].exercises).toHaveLength(1);
    expect(days[1].exercises.map((item) => item.name)).toEqual(["Chest Press", "Pec Deck"]);
  });
});

describe("formatMachineCatalogForAi", () => {
  it("prints name | slug | muscle | equipment | difficulty", () => {
    expect(formatMachineCatalogForAi(catalog.slice(0, 1))).toBe(
      "Leg Press Machine | leg-press | legs | machine | beginner",
    );
  });
});
