import { describe, expect, it } from "vitest";
import {
  computeNextFireAt,
  formatScheduleLabel,
  parseScheduleTime,
} from "./schedule";

describe("parseScheduleTime", () => {
  it("parses HH:MM", () => {
    expect(parseScheduleTime("09:30")).toEqual({ hour: 9, minute: 30 });
    expect(parseScheduleTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });

  it("clamps invalid values", () => {
    expect(parseScheduleTime("99:99")).toEqual({ hour: 23, minute: 59 });
  });
});

describe("computeNextFireAt", () => {
  it("returns a future fire time for daily schedule", () => {
    const from = new Date("2026-08-04T01:00:00.000Z");
    const next = computeNextFireAt({
      scheduleTime: "08:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      timezone: "Asia/Manila",
      from,
    });
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });

  it("skips days not in the schedule", () => {
    // 2026-08-04 is a Tuesday (ISO weekday 2)
    const from = new Date("2026-08-04T00:00:00.000Z");
    const next = computeNextFireAt({
      scheduleTime: "06:00",
      daysOfWeek: [1], // Monday only
      timezone: "UTC",
      from,
    });
    expect(next.getUTCDay()).toBe(1); // Sunday=0 … Monday=1
  });
});

describe("formatScheduleLabel", () => {
  it("labels every day", () => {
    expect(formatScheduleLabel("07:15", [1, 2, 3, 4, 5, 6, 7])).toBe(
      "Every day · 07:15",
    );
  });

  it("lists selected weekdays", () => {
    expect(formatScheduleLabel("18:00", [1, 3, 5])).toBe("Mon, Wed, Fri · 18:00");
  });
});
