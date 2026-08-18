import { describe, expect, it } from "vitest";
import { leftoverReminderCopy } from "@/lib/reminders/today-leftovers-copy";

describe("leftoverReminderCopy", () => {
  it("returns null when the day is clear", () => {
    expect(leftoverReminderCopy([])).toBeNull();
  });

  it("joins leftovers into an evening catch-up note", () => {
    const copy = leftoverReminderCopy(["2 habits", "500 ml of water", "today’s gym program"]);
    expect(copy?.title).toBe("Evening catch-up");
    expect(copy?.body).toContain("2 habits");
    expect(copy?.body).toContain("500 ml of water");
    expect(copy?.body).toContain("today’s gym program");
  });
});
