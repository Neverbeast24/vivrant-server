import { describe, expect, it } from "vitest";
import {
  applyRoutineOverrides,
  bmiBand,
  clampGymPlanPrefs,
  computeBmi,
  parseRoutineDefaults,
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
      session_minutes: 45,
      known_machine_slugs: [],
      avoid_targets: [],
    });
  });

  it("clamps invalid prefs", () => {
    expect(clampGymPlanPrefs({ days_per_week: 99, session_minutes: 5 })).toEqual({
      days_per_week: 6,
      session_minutes: 15,
      known_machine_slugs: [],
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

  it("sanitizes avoid targets", () => {
    expect(
      clampGymPlanPrefs({
        avoid_targets: ["core", "CORE", "not-a-target", "lower back", "arms"],
      }).avoid_targets,
    ).toEqual(["core", "lower_back", "arms"]);
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
      { days_per_week: 5, session_minutes: 40, known_machine_slugs: [], avoid_targets: [] },
    );
    expect(scaled.days_per_week).toBe("5");
    expect(scaled.session_minutes).toBe("40");
    expect(base.days_per_week).toBe(4);
  });
});
