import { describe, expect, it } from "vitest";
import {
  applyRoutineOverrides,
  bmiBand,
  clampGymPlanPrefs,
  computeBmi,
  MAX_KNOWN_MACHINE_SLUGS,
  parseRoutineDefaults,
  summarizeBmi,
  weightForBmi,
} from "./body-metrics";

describe("computeBmi", () => {
  it("computes BMI for valid inputs", () => {
    const bmi = computeBmi(170, 68);
    expect(bmi).not.toBeNull();
    expect(bmi!).toBeCloseTo(23.53, 1);
  });

  it("returns null for invalid inputs", () => {
    expect(computeBmi(0, 70)).toBeNull();
    expect(computeBmi(170, 0)).toBeNull();
    expect(computeBmi(-1, 70)).toBeNull();
  });
});

describe("bmiBand", () => {
  it("classifies bands", () => {
    expect(bmiBand(17)).toBe("underweight");
    expect(bmiBand(22)).toBe("normal");
    expect(bmiBand(27)).toBe("overweight");
    expect(bmiBand(32)).toBe("obese");
  });
});

describe("summarizeBmi", () => {
  it("rounds BMI and labels the band", () => {
    const summary = summarizeBmi(170, 68);
    expect(summary).toMatchObject({ bmi: 23.5, band: "normal", band_label: "Normal" });
  });

  it("returns null when height or weight is missing", () => {
    expect(summarizeBmi(null, 68)).toBeNull();
    expect(summarizeBmi(170, undefined)).toBeNull();
  });
});

describe("weightForBmi", () => {
  it("solves target weight from height and BMI", () => {
    const kg = weightForBmi(170, 22);
    expect(kg).toBeCloseTo(63.58, 1);
  });
});

describe("parseRoutineDefaults", () => {
  it("parses midpoints from suggested ranges", () => {
    expect(parseRoutineDefaults({ days_per_week: "3–4", session_minutes: "35–55" })).toEqual({
      days_per_week: 4,
      training_days: [1, 2, 4, 5],
      session_minutes: 45,
      level: "beginner",
      known_machine_slugs: [],
      known_custom_exercises: [],
      avoid_targets: [],
    });
  });

  it("clamps invalid prefs", () => {
    expect(clampGymPlanPrefs({ days_per_week: 99, session_minutes: 5 })).toEqual({
      days_per_week: 6,
      training_days: [1, 2, 3, 4, 5, 7],
      session_minutes: 15,
      level: "beginner",
      known_machine_slugs: [],
      known_custom_exercises: [],
      avoid_targets: [],
    });
  });

  it("sanitizes known machine slugs", () => {
    expect(
      clampGymPlanPrefs({
        known_machine_slugs: [" Leg-Press ", "leg-press", "", "lat-pulldown"],
      }).known_machine_slugs,
    ).toEqual(["leg-press", "lat-pulldown"]);
  });

  it("keeps a broad known-exercise selection", () => {
    const slugs = Array.from({ length: 80 }, (_, i) => `machine-${i}`);
    expect(clampGymPlanPrefs({ known_machine_slugs: slugs }).known_machine_slugs).toHaveLength(80);
    const overflow = Array.from({ length: MAX_KNOWN_MACHINE_SLUGS + 5 }, (_, i) => `machine-${i}`);
    expect(clampGymPlanPrefs({ known_machine_slugs: overflow }).known_machine_slugs).toHaveLength(
      MAX_KNOWN_MACHINE_SLUGS,
    );
  });

  it("sanitizes custom exercises", () => {
    expect(
      clampGymPlanPrefs({
        known_custom_exercises: ["  Hip thrust ", "hip thrust", "a", "Landmine press"],
      }).known_custom_exercises,
    ).toEqual(["Hip Thrust", "Landmine Press"]);
  });

  it("splits comma lists and strips stray punctuation on custom moves", () => {
    expect(
      clampGymPlanPrefs({
        known_custom_exercises: [", tricep rope,", "hip thrust, landmine press"],
      }).known_custom_exercises,
    ).toEqual(["Tricep Rope", "Hip Thrust", "Landmine Press"]);
  });

  it("defaults and sanitizes experience level", () => {
    expect(clampGymPlanPrefs({}).level).toBe("beginner");
    expect(clampGymPlanPrefs({ level: "ADVANCED" }).level).toBe("advanced");
    expect(clampGymPlanPrefs({ level: "intermediate" }).level).toBe("intermediate");
    expect(clampGymPlanPrefs({ level: "expert" }).level).toBe("beginner");
  });

  it("sanitizes avoid targets", () => {
    expect(
      clampGymPlanPrefs({
        avoid_targets: ["core", "CORE", "not-a-target", "lower back", "arms"],
      }).avoid_targets,
    ).toEqual(["core", "lower_back", "arms"]);
  });

  it("uses explicit training weekdays and derives days_per_week", () => {
    expect(
      clampGymPlanPrefs({
        days_per_week: 3,
        training_days: [1, 2, 3, 4, 5, 7],
      }).training_days,
    ).toEqual([1, 2, 3, 4, 5, 7]);
    expect(
      clampGymPlanPrefs({
        days_per_week: 3,
        training_days: [1, 2, 3, 4, 5, 7],
      }).days_per_week,
    ).toBe(6);
  });

  it("applies overrides onto scaling", () => {
    const base = parseRoutineDefaults({ days_per_week: "3–4", session_minutes: "35–55" });
    const scaled = applyRoutineOverrides(
      {
        bmi: 28.7,
        band: "overweight",
        band_label: "Overweight",
        height_cm: 160,
        weight_kg: 73,
        goal_weight_kg: 50,
        kg_to_goal: -23,
        target_date: null,
        weeks_remaining: null,
        suggested_kg_per_week: null,
        pace_note: null,
        focus: "fat loss",
        days_per_week: "3–4",
        session_minutes: "35–55",
        intensity: "moderate",
        tips: [],
        summary: "test",
      },
      {
        days_per_week: 5,
        training_days: [1, 2, 3, 4, 5],
        session_minutes: 40,
        level: "intermediate",
        known_machine_slugs: [],
        known_custom_exercises: [],
        avoid_targets: [],
      },
    );
    expect(scaled.days_per_week).toBe("5");
    expect(scaled.session_minutes).toBe("40");
    expect(base.days_per_week).toBe(4);
  });
});
