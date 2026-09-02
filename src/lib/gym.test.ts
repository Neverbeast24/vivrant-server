import { describe, expect, it } from "vitest";
import {
  buildGymPlanAvailableExercises,
  constrainGymPlanToKnownMoves,
  formatGymExerciseLine,
  formatGymMoveName,
  findRelatedExerciseMatch,
  formatRestClock,
  gymSessionFocusFromPlan,
  hydrateGymPlan,
  isAllowedGymPlanMove,
  parseGymPlanDays,
  parseRestSeconds,
  parseSetCount,
  parseTimedMinutes,
  pickTodaysPlanDay,
  findPlanDayByLabel,
  filterGymMoveCatalog,
  nextGymMoveWeight,
  nextGymMovePrescription,
  isCardioGymMove,
  resolveSessionMoveWeight,
  suggestGymMoveWeight,
  resolveSessionPlanDay,
  serializeGymPlanDays,
  enrichGymPlanDays,
  summarizeTodaysProgram,
  labelGymPlanDaysWithWeekdays,
  reminderDaysFromGymPlan,
  moveSavedPlanDay,
  findMissedProgramDays,
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
      { instead_of: "Lat Pulldown", use: "Assisted Pull-Up" },
    ]);
    expect(parsed.days[0].additionals).toEqual([{ name: "Face Pulls", sets: "3 x 15" }]);
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
      { instead_of: "Lat Pulldown", use: "Seated Row" },
      { instead_of: "Leg Press", use: "Goblet Squat" },
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

  it("stores training days on the first session", () => {
    const packed = serializeGymPlanDays(
      [{ day: "Monday · Pull", focus: "Pull", exercises: [] }],
      [],
      [1, 2, 3, 4, 5, 7],
    );
    expect(packed[0]).toMatchObject({ training_days: [1, 2, 3, 4, 5, 7] });
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
      instead_of: "Lat Pulldown Machine",
      use: "Seated cable row",
    });
    expect(days[0].additionals?.some((item) => item.name === "Cable face pull")).toBe(true);
  });
});

describe("buildGymPlanAvailableExercises", () => {
  const rows = [
    {
      slug: "leg-press",
      name: "Leg press machine",
      muscle_group: "legs",
      equipment: "machine",
      difficulty: "beginner",
    },
    {
      slug: "horizontal-leg-press",
      name: "Horizontal leg press",
      muscle_group: "legs",
      equipment: "machine",
      difficulty: "beginner",
    },
    {
      slug: "leg-curl-machine",
      name: "Lying leg curl machine",
      muscle_group: "hamstrings",
      equipment: "machine",
      difficulty: "beginner",
    },
  ];

  it("sends only marked moves when the user picked known exercises", () => {
    const { catalogText, knownRows, restrictToKnown } = buildGymPlanAvailableExercises(rows, {
      known_machine_slugs: ["leg-curl-machine"],
      known_custom_exercises: ["stiffed leg lift"],
      avoid_targets: [],
    });
    expect(restrictToKnown).toBe(true);
    expect(knownRows.map((row) => row.slug)).toEqual(["leg-curl-machine"]);
    expect(catalogText).toContain("ALLOWED EXERCISES ONLY");
    expect(catalogText).toContain("Lying leg curl machine");
    expect(catalogText).toContain("stiffed leg lift");
    expect(catalogText).not.toContain("OTHER CATALOG");
    expect(catalogText).not.toContain("horizontal-leg-press");
  });
});

describe("constrainGymPlanToKnownMoves", () => {
  const catalog = [
    { name: "Horizontal leg press", muscle_group: "legs", equipment: "machine", slug: "horizontal-leg-press" },
    { name: "Lying leg curl machine", muscle_group: "hamstrings", equipment: "machine", slug: "leg-curl-machine" },
    { name: "Sit-up machine", muscle_group: "core", equipment: "machine", slug: "sit-up-machine" },
  ];

  it("replaces an unmarked leg press with a known lower-body move", () => {
    const days = constrainGymPlanToKnownMoves(
      [
        {
          day: "Day 5",
          focus: "Hamstrings Inner Thighs & Core",
          exercises: [
            {
              name: "Horizontal leg press machine",
              sets: "4 x 12",
              rest: "90s",
              notes: "Mid-to-high foot placement focused on quad and knee-dominant drive.",
            },
            { name: "Lying leg curl machine", sets: "4 x 12-15", rest: "90s" },
          ],
          additionals: [{ name: "Leg press machine", sets: "2 x 12" }],
        },
      ],
      [
        { name: "Lying leg curl machine", muscle_group: "hamstrings", slug: "leg-curl-machine" },
        { name: "Sit-up machine", muscle_group: "core", slug: "sit-up-machine" },
      ],
      ["stiffed leg lift", "multi press"],
      catalog,
    );
    const names = days[0].exercises.map((ex) => ex.name.toLowerCase());
    expect(names.some((name) => name.includes("leg press"))).toBe(false);
    expect(names).toContain("lying leg curl machine");
    expect(names).toContain("stiffed leg lift");
    expect(days[0].exercises[0].notes).toBeUndefined();
    expect(days[0].additionals ?? []).toEqual([]);
  });

  it("does not treat multi press as a match for leg press", () => {
    expect(isAllowedGymPlanMove("Horizontal leg press machine", [{ name: "multi press" }])).toBe(false);
    expect(isAllowedGymPlanMove("Lying leg curl machine", [{ name: "Lying leg curl machine" }])).toBe(true);
  });
});

describe("formatGymExerciseLine", () => {
  it("includes weight when set", () => {
    expect(
      formatGymExerciseLine({ name: "Lat pulldown", sets: "4 x 10", rest: "90s", weight: "18 kg" }),
    ).toBe("Lat Pulldown · 4 x 10 · 18 kg · rest 90s");
  });
});

describe("suggestGymMoveWeight", () => {
  it("labels cardio and bodyweight moves", () => {
    expect(suggestGymMoveWeight("Treadmill incline walk")).toBe("easy pace");
    expect(suggestGymMoveWeight("Bodyweight Squat")).toBe("bodyweight");
    expect(
      suggestGymMoveWeight("Forearm plank", {
        catalog: [{ name: "Forearm plank", equipment: "bodyweight" }],
      }),
    ).toBe("bodyweight");
  });

  it("sizes isolation vs compound loads from body weight and program level", () => {
    expect(suggestGymMoveWeight("Leg Extension Machine", { level: "beginner", bodyWeightKg: 70 })).toBe(
      "16–20 kg",
    );
    expect(suggestGymMoveWeight("Chest Press Machine", { level: "beginner", bodyWeightKg: 70 })).toBe(
      "36–40 kg",
    );
    expect(suggestGymMoveWeight("Chest Press Machine", { level: "advanced", bodyWeightKg: 70 })).toBe(
      "76–80 kg",
    );
  });

  it("keeps a typed load when the move changes, otherwise follows the new suggestion", () => {
    expect(nextGymMoveWeight("Leg Extension Machine", "40 kg", "Chest Press Machine", { level: "beginner" })).toBe(
      "40 kg",
    );
    expect(
      nextGymMoveWeight("Bodyweight Squat", "36–40 kg", "Chest Press Machine", {
        level: "beginner",
        bodyWeightKg: 70,
      }),
    ).toBe("bodyweight");
    expect(resolveSessionMoveWeight("Lat pulldown", "15–20 kg", undefined)).toBe("15–20 kg");
    expect(resolveSessionMoveWeight("Lat pulldown", undefined, "18 kg")).toBe("18 kg");
  });
});

describe("formatGymMoveName", () => {
  it("title-cases typed moves and strips stray commas", () => {
    expect(formatGymMoveName("multi press")).toBe("Multi Press");
    expect(formatGymMoveName(", tricep rope,")).toBe("Tricep Rope");
    expect(formatGymMoveName("leg curl (extension)")).toBe("Leg Curl (Extension)");
  });
});

describe("custom moves on saved programs", () => {
  it("adds cues for unmatched custom names on old programs", () => {
    const days = enrichGymPlanDays(
      [
        {
          day: "Day 1",
          focus: "Push",
          exercises: [{ name: "multi press", sets: "4 x 10–12", rest: "90s", weight: "30–40 kg" }],
        },
      ],
      [{ name: "Pec deck / fly machine", muscle_group: "chest", equipment: "machine" }],
    );
    expect(days[0].exercises[0].name).toBe("Multi Press");
    expect(days[0].exercises[0].notes).toMatch(/controlled path|Brace your core/i);
  });

  it("finds a related catalog demo for a typed press", () => {
    const related = findRelatedExerciseMatch("multi press", [
      { name: "Pec deck / fly machine", muscle_group: "chest" },
      { name: "Chest press machine", muscle_group: "chest" },
      { name: "Leg press machine", muscle_group: "legs" },
    ]);
    expect(related?.name).toBe("Chest press machine");
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
    expect(pickTodaysPlanDay(named, new Date("2026-08-18T12:00:00"))).toBeNull();
    expect(pickTodaysPlanDay(named, new Date("2026-08-19T12:00:00"))?.focus).toBe("Push");
  });

  it("returns null on rest days when sessions are weekday-labeled", () => {
    const named = [
      { day: "Monday · Pull", focus: "Pull", exercises: [] },
      { day: "Tuesday · Push", focus: "Push", exercises: [] },
      { day: "Wednesday · Legs", focus: "Legs", exercises: [] },
      { day: "Thursday · Upper", focus: "Upper", exercises: [] },
      { day: "Friday · Lower", focus: "Lower", exercises: [] },
      { day: "Sunday · Full body", focus: "Full body", exercises: [] },
    ];
    // 2026-08-22 is Saturday
    expect(pickTodaysPlanDay(named, new Date("2026-08-22T12:00:00"))).toBeNull();
    expect(pickTodaysPlanDay(named, new Date("2026-08-23T12:00:00"))?.focus).toBe("Full body");
  });

  it("uses Mon/Wed/Fri for unlabeled 3-day plans and rests on other days", () => {
    // 2026-08-17 is a Monday → Day 1
    expect(pickTodaysPlanDay(days, new Date("2026-08-17T12:00:00"))?.focus).toBe("Pull");
    expect(pickTodaysPlanDay(days, new Date("2026-08-18T12:00:00"))).toBeNull();
    expect(pickTodaysPlanDay(days, new Date("2026-08-19T12:00:00"))?.focus).toBe("Push");
  });

  it("maps a 6-day unlabeled plan onto Mon–Fri + Sunday", () => {
    const six = [
      ...days,
      { day: "Day 4", focus: "Upper", exercises: [] },
      { day: "Day 5", focus: "Lower", exercises: [] },
      { day: "Day 6", focus: "Full", exercises: [] },
    ];
    expect(pickTodaysPlanDay(six, new Date("2026-08-22T12:00:00"))).toBeNull();
    expect(pickTodaysPlanDay(six, new Date("2026-08-23T12:00:00"))?.focus).toBe("Full");
  });
});

describe("findPlanDayByLabel", () => {
  const named = [
    { day: "Monday · Pull", focus: "Pull", exercises: [] },
    { day: "Wednesday · Push", focus: "Push", exercises: [] },
  ];

  it("picks a saved day by weekday even when it is not today", () => {
    expect(findPlanDayByLabel(named, "Wednesday · Push")?.focus).toBe("Push");
    expect(findPlanDayByLabel(named, "monday")?.focus).toBe("Pull");
    expect(resolveSessionPlanDay(named, { label: "Wednesday" })?.focus).toBe("Push");
  });

  it("picks Day 2 labels without treating them as Tuesday", () => {
    const numbered = [
      { day: "Day 1: Upper Body Push & Core", focus: "Push", exercises: [] },
      { day: "Day 2: Lower Body Quads & Calves", focus: "Legs", exercises: [] },
    ];
    expect(findPlanDayByLabel(numbered, "Day 2: Lower Body Quads & Calves")?.focus).toBe("Legs");
    expect(
      resolveSessionPlanDay(numbered, { label: "Day 2: Lower Body Quads & Calves" })?.focus,
    ).toBe("Legs");
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

describe("cardio prescriptions", () => {
  it("detects treadmill and other cardio machines", () => {
    expect(isCardioGymMove("Treadmill incline walk")).toBe(true);
    expect(isCardioGymMove("Chest Press Machine")).toBe(false);
    expect(isCardioGymMove("Row", "cardio_machine")).toBe(true);
  });

  it("reads timed minutes from cardio labels", () => {
    expect(parseTimedMinutes("10 mins")).toBe(10);
    expect(parseTimedMinutes("8–12 mins easy")).toBe(8);
    expect(parseTimedMinutes("1 set of 35-40 mins")).toBe(35);
    expect(parseTimedMinutes("3 x 10")).toBeNull();
  });

  it("auto-fills minutes and zero rest when switching onto a treadmill", () => {
    const next = nextGymMovePrescription(
      "Treadmill",
      { sets: "3 x 10", rest: "60s", weight: "36–40 kg" },
      "Chest Press Machine",
      { level: "beginner", bodyWeightKg: 70 },
    );
    expect(next.sets).toBe("10 mins");
    expect(next.rest).toBe("0s");
    expect(next.weight).toBe("easy pace");
  });

  it("returns strength defaults when leaving cardio", () => {
    const next = nextGymMovePrescription(
      "Chest Press Machine",
      { sets: "10 mins", rest: "0s", weight: "easy pace" },
      "Treadmill",
      { level: "beginner", bodyWeightKg: 70 },
    );
    expect(next.sets).toBe("3 x 10");
    expect(next.rest).toBe("60s");
    expect(next.weight).toMatch(/kg/);
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
    expect(summary?.missed).toBeNull();
  });

  it("returns null when there are no plans", () => {
    expect(summarizeTodaysProgram([])).toBeNull();
  });
});

describe("findMissedProgramDays", () => {
  const named = [
    { day: "Monday · Push", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
    { day: "Wednesday · Pull", focus: "Pull", exercises: [{ name: "Row", sets: "3 x 10", rest: "60s" }] },
  ];

  it("flags Monday when Tuesday arrives with no gym log", () => {
    const missed = findMissedProgramDays(named, [], {
      date: new Date(2026, 7, 18, 12),
    });
    expect(missed[0]).toMatchObject({
      day: "Monday · Push",
      focus: "Push",
      weekdayName: "Monday",
    });
  });

  it("clears the skip when Monday was logged that day", () => {
    const missed = findMissedProgramDays(
      named,
      [{ logged_at: new Date(2026, 7, 17, 19).toISOString(), title: "Monday · Push: Push" }],
      { date: new Date(2026, 7, 18, 12) },
    );
    expect(missed).toEqual([]);
  });

  it("treats a Tuesday catch-up log as covering Monday", () => {
    const missed = findMissedProgramDays(
      named,
      [{ logged_at: new Date(2026, 7, 18, 19).toISOString(), title: "Monday · Push: Push" }],
      { date: new Date(2026, 7, 18, 20) },
    );
    expect(missed).toEqual([]);
  });
});

describe("labelGymPlanDaysWithWeekdays", () => {
  it("stamps weekday names onto sessions", () => {
    const labeled = labelGymPlanDaysWithWeekdays(
      [
        { day: "Day 1", focus: "Pull", exercises: [] },
        { day: "Day 2", focus: "Push", exercises: [] },
      ],
      [1, 7],
    );
    expect(labeled.map((day) => day.day)).toEqual(["Monday · Pull", "Sunday · Push"]);
  });
});

describe("moveSavedPlanDay", () => {
  it("moves a workout onto an empty weekday", () => {
    const next = moveSavedPlanDay(
      [
        {
          day: "Monday · Pull",
          focus: "Pull",
          exercises: [{ name: "Row", sets: "3 x 10", rest: "60s" }],
        },
      ],
      0,
      3,
    );
    expect(next).toHaveLength(1);
    expect(next[0].day).toMatch(/Wednesday/);
    expect(next[0].exercises[0].name).toBe("Row");
  });

  it("swaps two weekday sessions", () => {
    const next = moveSavedPlanDay(
      [
        {
          day: "Monday · Pull",
          focus: "Pull",
          exercises: [{ name: "Row", sets: "3 x 10", rest: "60s" }],
        },
        {
          day: "Wednesday · Push",
          focus: "Push",
          exercises: [{ name: "Press", sets: "3 x 8", rest: "90s" }],
        },
      ],
      0,
      3,
    );
    expect(next.find((day) => day.day.includes("Wednesday"))?.focus).toBe("Pull");
    expect(next.find((day) => day.day.includes("Monday"))?.focus).toBe("Push");
  });
});

describe("reminderDaysFromGymPlan", () => {
  it("reads weekdays from labeled sessions including Sunday", () => {
    expect(
      reminderDaysFromGymPlan({
        days_per_week: 6,
        days: [
          { day: "Monday · Pull" },
          { day: "Tuesday · Push" },
          { day: "Wednesday · Legs" },
          { day: "Thursday · Upper" },
          { day: "Friday · Lower" },
          { day: "Sunday · Full body" },
        ],
      }),
    ).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it("falls back to Mon–Fri + Sunday for a 6-day unlabeled plan", () => {
    expect(reminderDaysFromGymPlan({ days_per_week: 6, days: [{ day: "Day 1" }] })).toEqual([
      1, 2, 3, 4, 5, 7,
    ]);
  });
});

describe("filterGymMoveCatalog", () => {
  const catalog = [
    { name: "Pec Deck Fly Machine", muscle_group: "chest", equipment: "machine" },
    { name: "Chest Press Machine", muscle_group: "chest", equipment: "machine" },
    { name: "Tricep Rope", muscle_group: "arms", equipment: "cable" },
    { name: "Treadmill Intervals", muscle_group: "cardio", equipment: "cardio_machine" },
  ];

  it("ranks prefix matches ahead of contains, then muscle/equipment", () => {
    expect(filterGymMoveCatalog("pec", catalog).map((item) => item.name)).toEqual([
      "Pec Deck Fly Machine",
    ]);
    expect(filterGymMoveCatalog("chest", catalog).map((item) => item.name)).toEqual([
      "Chest Press Machine",
      "Pec Deck Fly Machine",
    ]);
    expect(filterGymMoveCatalog("cable", catalog).map((item) => item.name)).toEqual(["Tricep Rope"]);
  });

  it("caps an empty query to an A–Z slice", () => {
    const names = filterGymMoveCatalog("", catalog, 2).map((item) => item.name);
    expect(names).toEqual(["Chest Press Machine", "Pec Deck Fly Machine"]);
  });
});

describe("saved gym program edit round-trip", () => {
  it("keeps custom moves when a saved program is re-parsed for edit", () => {
    const packed = serializeGymPlanDays(
      [
        {
          day: "Day 2: Lower Body Quads & Calves",
          focus: "Legs",
          exercises: [{ name: "multi press", sets: "4 x 10", rest: "90s", weight: "30 kg" }],
        },
      ],
      ["Keep 2 reps in reserve."],
      [1, 2, 3, 4, 5, 7],
    );
    const parsed = parseGymPlanDays(packed);
    expect(parsed.days[0].exercises[0].name).toBe("Multi Press");
    expect(parsed.days[0].exercises[0].weight).toBe("30 kg");
    expect(parsed.training_days).toEqual([1, 2, 3, 4, 5, 7]);
  });
});
