import { describe, expect, it } from "vitest";
import {
  formatGymExerciseLine,
  hydrateGymPlan,
  parseGymPlanDays,
  serializeGymPlanDays,
} from "./gym";

describe("parseGymPlanDays", () => {
  it("reads weight, notes, and recommendations from day 1", () => {
    const parsed = parseGymPlanDays([
      {
        day: "Day 1",
        focus: "Upper body",
        recommendations: ["Start at the light end of each range."],
        exercises: [{ name: "Lat pulldown", sets: "4 x 10-12", rest: "90s", weight: "15–20 kg" }],
      },
    ]);
    expect(parsed.recommendations).toEqual(["Start at the light end of each range."]);
    expect(parsed.days[0].exercises[0].weight).toBe("15–20 kg");
  });
});

describe("serializeGymPlanDays", () => {
  it("stores program recs on the first day only", () => {
    const packed = serializeGymPlanDays(
      [
        { day: "Day 1", focus: "Pull", exercises: [{ name: "Row", sets: "3 x 10", rest: "60s" }] },
        { day: "Day 2", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
      ],
      ["Keep 2 reps in reserve."],
    );
    expect(packed[0]).toMatchObject({ recommendations: ["Keep 2 reps in reserve."] });
    expect(packed[1]).not.toHaveProperty("recommendations");
  });
});

describe("hydrateGymPlan", () => {
  it("prefers top-level recommendations when present", () => {
    const plan = hydrateGymPlan({
      days: [
        {
          day: "Day 1",
          focus: "Train",
          recommendations: ["From day"],
          exercises: [],
        },
      ],
      recommendations: ["From top"],
    });
    expect(plan.recommendations).toEqual(["From top"]);
    expect(plan.days[0]).not.toHaveProperty("recommendations");
  });
});

describe("formatGymExerciseLine", () => {
  it("includes weight when set", () => {
    expect(
      formatGymExerciseLine({ name: "Lat pulldown", sets: "4 x 10", rest: "90s", weight: "18 kg" }),
    ).toBe("Lat pulldown · 4 x 10 · 18 kg · rest 90s");
  });
});
