import { describe, expect, it } from "vitest";
import {
  assembleKeptPlanDays,
  dropKeptDay,
  draftFromSavedPlan,
  keepPreviewDay,
  mapPreviewToWeekdays,
  mergePlanDaysIntoDraft,
  moveKeptDay,
  remainingTrainingDays,
  reorderPreviewExercises,
  summarizeSessionsForAi,
  type GymProgramDraft,
} from "./gym-program-draft";
import {
  parseGymLiveSession,
  restEndsAtFromSeconds,
  restRemainingSeconds,
} from "./gym-live-session";

const sampleDay = {
  day: "Monday · Pull",
  focus: "Pull",
  exercises: [{ name: "Lat pulldown", sets: "4 x 10", rest: "90s" }],
};

function draft(partial: Partial<GymProgramDraft> = {}): GymProgramDraft {
  return {
    title: "Test",
    focus: "strength",
    level: "beginner",
    summary: null,
    recommendations: [],
    prefs: {
      days_per_week: 3,
      training_days: [1, 3, 5],
      session_minutes: 45,
      level: "beginner",
      known_machine_slugs: [],
      known_custom_exercises: [],
      avoid_targets: [],
    },
    preview_days: [sampleDay],
    kept_days: {},
    training_days: [1, 3, 5],
    updated_at: "2026-08-19T00:00:00.000Z",
    ...partial,
  };
}

describe("program builder days", () => {
  it("keeps a generated day onto a weekday slot", () => {
    const next = keepPreviewDay(draft(), 1);
    expect(next.kept_days["1"]?.exercises[0]?.name).toBe("Lat pulldown");
    expect(remainingTrainingDays([1, 3, 5], next.kept_days)).toEqual([3, 5]);
  });

  it("drops a kept day so it can be generated again", () => {
    const kept = keepPreviewDay(draft(), 1);
    const next = dropKeptDay(kept, 1);
    expect(next.kept_days["1"]).toBeUndefined();
    expect(assembleKeptPlanDays(next)).toEqual([]);
  });

  it("swaps a kept workout onto another weekday", () => {
    const kept = keepPreviewDay(draft(), 1);
    const next = moveKeptDay(kept, 1, 3);
    expect(next.kept_days["1"]).toBeUndefined();
    expect(next.kept_days["3"]?.exercises[0]?.name).toBe("Lat pulldown");
    expect(next.kept_days["3"]?.day).toMatch(/Wednesday/);
  });

  it("reorders moves inside a generated preview day", () => {
    const withMoves = draft({
      preview_days: [
        {
          day: "Monday · Pull",
          focus: "Pull",
          exercises: [
            { name: "Lat pulldown", sets: "4 x 10", rest: "90s" },
            { name: "Row", sets: "3 x 12", rest: "60s" },
          ],
        },
      ],
    });
    const next = reorderPreviewExercises(withMoves, 0, 0, 1);
    expect(next.preview_days[0].exercises.map((ex) => ex.name)).toEqual(["Row", "Lat pulldown"]);
  });

  it("maps a generated batch onto remaining weekdays", () => {
    const mapped = mapPreviewToWeekdays(
      [
        { day: "Day 1", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
        { day: "Day 2", focus: "Legs", exercises: [{ name: "Squat", sets: "3 x 8", rest: "90s" }] },
      ],
      [3, 5],
    );
    expect(mapped.map((day) => day.day)).toEqual(["Wednesday · Push", "Friday · Legs"]);
  });

  it("copies a saved program into an empty draft week", () => {
    const next = draftFromSavedPlan({
      title: "Push Pull",
      focus: "strength",
      level: "intermediate",
      days: [
        { day: "Monday · Push", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
        { day: "Friday · Pull", focus: "Pull", exercises: [{ name: "Row", sets: "3 x 12", rest: "60s" }] },
      ],
    });
    expect(next.kept_days["1"]?.exercises[0]?.name).toBe("Press");
    expect(next.kept_days["5"]?.exercises[0]?.name).toBe("Row");
    expect(next.training_days).toEqual([1, 5]);
  });

  it("fills empty draft slots from a saved program without replacing kept days", () => {
    const base = keepPreviewDay(draft(), 1);
    const next = mergePlanDaysIntoDraft(
      base,
      [
        { day: "Monday · Push", focus: "Push", exercises: [{ name: "Press", sets: "3 x 8", rest: "90s" }] },
        { day: "Wednesday · Legs", focus: "Legs", exercises: [{ name: "Squat", sets: "3 x 8", rest: "90s" }] },
      ],
      "fill",
    );
    expect(next.kept_days["1"]?.exercises[0]?.name).toBe("Lat pulldown");
    expect(next.kept_days["3"]?.exercises[0]?.name).toBe("Squat");
  });

  it("overwrites matching weekdays when merging a saved program", () => {
    const base = keepPreviewDay(draft(), 1);
    const next = mergePlanDaysIntoDraft(
      base,
      [{ day: "Monday · Push", focus: "Push", exercises: [{ name: "Press", sets: "3 x 8", rest: "90s" }] }],
      "overwrite",
    );
    expect(next.kept_days["1"]?.exercises[0]?.name).toBe("Press");
  });

  it("summarizes kept sessions for the generator prompt", () => {
    const note = summarizeSessionsForAi([
      { day: "Monday · Push", focus: "Push", exercises: [{ name: "Press", sets: "3 x 10", rest: "60s" }] },
    ]);
    expect(note).toContain("Monday · Push");
    expect(note).toContain("Press");
  });
});

describe("live rest timer", () => {
  it("computes remaining seconds from an end timestamp", () => {
    const now = 1_000_000;
    const ends = restEndsAtFromSeconds(90, now);
    expect(restRemainingSeconds(ends, now)).toBe(90);
    expect(restRemainingSeconds(ends, now + 30_000)).toBe(60);
    expect(restRemainingSeconds(ends, now + 120_000)).toBe(0);
  });

  it("round-trips extra moves on a live session draft", () => {
    const parsed = parseGymLiveSession({
      plan_id: 7,
      day_label: "Monday · Pull",
      session_date: "2026-08-27",
      checks: { "extra-1": [false, false] },
      names: { "extra-1": "Treadmill" },
      weights: { "extra-1": "easy pace" },
      extras: [
        {
          key: "extra-1",
          name: "Treadmill",
          setsLabel: "10 mins",
          rest: "0s",
          setCount: 1,
          restSeconds: 0,
        },
      ],
      removed_keys: ["main-2"],
      rest_kind: "work",
    });
    expect(parsed?.extras[0]?.setsLabel).toBe("10 mins");
    expect(parsed?.removed_keys).toEqual(["main-2"]);
    expect(parsed?.rest_kind).toBe("work");
    expect(parsed?.names["extra-1"]).toBe("Treadmill");
  });
});
