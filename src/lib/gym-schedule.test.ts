import { describe, expect, it } from "vitest";
import {
  defaultTrainingDaysFromCount,
  formatRestDaysLabel,
  formatTrainingDaysLabel,
  nextTrainingDayHint,
  parseTrainingDays,
  sanitizeTrainingDays,
} from "./gym-schedule";

describe("defaultTrainingDaysFromCount", () => {
  it("spreads 6 days as Mon–Fri + Sunday", () => {
    expect(defaultTrainingDaysFromCount(6)).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it("spreads 3 days as Mon/Wed/Fri", () => {
    expect(defaultTrainingDaysFromCount(3)).toEqual([1, 3, 5]);
  });
});

describe("sanitizeTrainingDays", () => {
  it("keeps a custom Mon–Fri + Sunday week", () => {
    expect(sanitizeTrainingDays([1, 2, 3, 4, 5, 7])).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it("falls back when the selection is too short", () => {
    expect(parseTrainingDays([1])).toEqual([]);
    expect(sanitizeTrainingDays([1], 3)).toEqual([1, 3, 5]);
  });
});

describe("formatTrainingDaysLabel", () => {
  it("compacts consecutive weekdays", () => {
    expect(formatTrainingDaysLabel([1, 2, 3, 4, 5, 7])).toBe("Mon–Fri, Sun");
  });
});

describe("formatRestDaysLabel", () => {
  it("names the leftover day", () => {
    expect(formatRestDaysLabel([1, 2, 3, 4, 5, 7])).toBe("Rest Sat");
  });
});

describe("nextTrainingDayHint", () => {
  it("says Tomorrow when the next session is the following day", () => {
    // 2026-08-20 is Thursday; Friday is a training day.
    expect(nextTrainingDayHint([1, 2, 3, 4, 5, 7], new Date("2026-08-20T12:00:00"))).toBe(
      "Tomorrow",
    );
  });

  it("names the next weekday after a rest day", () => {
    // 2026-08-21 is Friday; Saturday is rest, so next is Sunday.
    expect(nextTrainingDayHint([1, 2, 3, 4, 5, 7], new Date("2026-08-21T12:00:00"))).toBe(
      "Sunday",
    );
  });
});
