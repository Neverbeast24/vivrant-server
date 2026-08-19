import { describe, expect, it } from "vitest";
import {
  assembleKeptPlanDays,
  dropKeptDay,
  keepPreviewDay,
  mapPreviewToWeekdays,
  remainingTrainingDays,
  type GymProgramDraft,
} from "./gym-program-draft";
import { restEndsAtFromSeconds, restRemainingSeconds } from "./gym-live-session";

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
});

describe("live rest timer", () => {
  it("computes remaining seconds from an end timestamp", () => {
    const now = 1_000_000;
    const ends = restEndsAtFromSeconds(90, now);
    expect(restRemainingSeconds(ends, now)).toBe(90);
    expect(restRemainingSeconds(ends, now + 30_000)).toBe(60);
    expect(restRemainingSeconds(ends, now + 120_000)).toBe(0);
  });
});
