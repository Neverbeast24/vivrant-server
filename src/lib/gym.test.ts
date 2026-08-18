import { describe, expect, it } from "vitest";
import {
  formatGymExerciseLine,
  formatRestClock,
  gymSessionFocusFromPlan,
  hydrateGymPlan,
  parseGymPlanDays,
  parseRestSeconds,
  parseSetCount,
  pickTodaysPlanDay,
  serializeGymPlanDays,
  enrichGymPlanDays,
  summarizeTodaysProgram,
} from "./gym";

describe("parseGymPlanDays", () => {
  it("reads weight, notes, alternatives, and add-ons", () => {
    const parsed = parseGymPlanDays([
      {
        day: "Day 1",
        focus: "Upper body",
        recommendations: ["Start at the light end of each range."],
        exercises: [{ name: "Lat pulldown", sets: "4 x 10-12", rest: "90s", weight: "15–20 kg" }],
        alternatives: [{ instead_of: "Lat pulldown", use: "Assisted pull-up" }],
        additionals: [{ name: "Face pulls", sets: "3 x 15" }],
      },
    ]);
    expect(parsed.recommendations).toEqual(["Start at the light end of each range."]);
    expect(parsed.days[0].exercises[0].weight).toBe("15–20 kg");
    expect(parsed.days[0].alternatives).toEqual([
      { instead_of: "Lat pulldown", use: "Assisted pull-up" },
    ]);
    expect(parsed.days[0].additionals).toEqual([{ name: "Face pulls", sets: "3 x 15" }]);
  });

  it("parses string swaps", () => {
    const parsed = parseGymPlanDays([
      {
        day: "Day 1",
        focus: "Push",
        exercises: [],
        alternatives: ["Seated row instead of lat pulldown", "Leg press → goblet squat"],
      },
    ]);
    expect(parsed.days[0].alternatives).toEqual([
      { instead_of: "lat pulldown", use: "Seated row" },
      { instead_of: "Leg press", use: "goblet squat" },
    ]);
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

describe("enrichGymPlanDays", () => {
  const catalog = [
    { name: "Lat pulldown machine", muscle_group: "back", equipment: "machine" },
    { name: "Seated cable row", muscle_group: "back", equipment: "cable" },
    { name: "Dumbbell row", muscle_group: "back", equipment: "dumbbell" },
    { name: "Cable face pull", muscle_group: "shoulders", equipment: "cable" },
    { name: "Forearm plank", muscle_group: "core", equipment: "bodyweight" },
  ];

  it("fills swaps and extras when Gemini omitted them", () => {
    const days = enrichGymPlanDays(
      [
        {
          day: "Day 1",
          focus: "Pull",
          exercises: [{ name: "Lat pulldown machine", sets: "4 x 10", rest: "90s" }],
        },
      ],
      catalog,
    );
    expect(days[0].alternatives?.[0]).toMatchObject({
      instead_of: "Lat pulldown machine",
      use: "Seated cable row",
    });
    expect(days[0].additionals?.some((item) => item.name === "Cable face pull")).toBe(true);
  });
});

describe("formatGymExerciseLine", () => {
  it("includes weight when set", () => {
    expect(
      formatGymExerciseLine({ name: "Lat pulldown", sets: "4 x 10", rest: "90s", weight: "18 kg" }),
    ).toBe("Lat pulldown · 4 x 10 · 18 kg · rest 90s");
  });
});

describe("pickTodaysPlanDay", () => {
  const days = [
    { day: "Day 1", focus: "Pull", exercises: [{ name: "Row", sets: "3 x 10", rest: "60s" }] },
    { day: "Day 2", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
    { day: "Day 3", focus: "Legs", exercises: [{ name: "Squat", sets: "3 x 8", rest: "90s" }] },
  ];

  it("matches a weekday name on the session label", () => {
    const named = [
      { day: "Monday · Pull", focus: "Pull", exercises: [] },
      { day: "Wednesday", focus: "Push", exercises: [] },
    ];
    expect(pickTodaysPlanDay(named, new Date("2026-08-17T12:00:00"))?.focus).toBe("Pull");
    expect(pickTodaysPlanDay(named, new Date("2026-08-19T12:00:00"))?.focus).toBe("Push");
  });

  it("rotates unnamed days from Monday", () => {
    // 2026-08-17 is a Monday → Day 1
    expect(pickTodaysPlanDay(days, new Date("2026-08-17T12:00:00"))?.focus).toBe("Pull");
    expect(pickTodaysPlanDay(days, new Date("2026-08-18T12:00:00"))?.focus).toBe("Push");
  });
});

describe("parseRestSeconds", () => {
  it("reads seconds, minutes, and zero rest", () => {
    expect(parseRestSeconds("90s")).toBe(90);
    expect(parseRestSeconds("2 min")).toBe(120);
    expect(parseRestSeconds("60-90s")).toBe(60);
    expect(parseRestSeconds("0s")).toBe(0);
    expect(parseRestSeconds("none")).toBe(0);
  });
});

describe("parseSetCount", () => {
  it("reads the leading set count", () => {
    expect(parseSetCount("4 x 10-12")).toBe(4);
    expect(parseSetCount("3x10")).toBe(3);
    expect(parseSetCount("1 set of 35-40 mins")).toBe(1);
    expect(parseSetCount("12 minutes steady")).toBe(1);
  });
});

describe("gymSessionFocusFromPlan", () => {
  it("maps day labels onto session focus values", () => {
    expect(gymSessionFocusFromPlan("Pull")).toBe("upper");
    expect(gymSessionFocusFromPlan("Leg day")).toBe("lower");
    expect(gymSessionFocusFromPlan("strength")).toBe("strength");
    expect(gymSessionFocusFromPlan("HIIT")).toBe("endurance");
  });
});

describe("formatRestClock", () => {
  it("formats m:ss", () => {
    expect(formatRestClock(90)).toBe("1:30");
    expect(formatRestClock(5)).toBe("0:05");
  });
});

describe("summarizeTodaysProgram", () => {
  it("returns the latest plan and a short today list", () => {
    const summary = summarizeTodaysProgram(
      [
        {
          title: "Upper/Lower",
          focus: "strength",
          days_per_week: 4,
          days: [
            {
              day: "Day 1",
              focus: "Upper",
              exercises: [
                { name: "Press", sets: "4 x 8", rest: "90s" },
                { name: "Row", sets: "4 x 10", rest: "90s" },
              ],
            },
          ],
        },
      ],
      new Date("2026-08-17T12:00:00"),
    );
    expect(summary?.title).toBe("Upper/Lower");
    expect(summary?.planCount).toBe(1);
    expect(summary?.today?.exercises.map((ex) => ex.name)).toEqual(["Press", "Row"]);
  });

  it("returns null when there are no plans", () => {
    expect(summarizeTodaysProgram([])).toBeNull();
  });
});
