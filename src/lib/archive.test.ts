import { describe, expect, it } from "vitest";
import { ARCHIVE_LABELS, isArchiveTable, titleFromRow } from "./archive-catalog";

describe("archive helpers", () => {
  it("recognizes archiveable tables", () => {
    expect(isArchiveTable("nutrition_logs")).toBe(true);
    expect(isArchiveTable("device_tokens")).toBe(false);
  });

  it("picks a human title from a row", () => {
    expect(titleFromRow("nutrition_logs", { meal_name: "Chicken rice" })).toBe("Chicken rice");
    expect(titleFromRow("health_history", { recorded_at: "2026-08-19T00:00:00Z" })).toBe(
      "Entry 2026-08-19",
    );
    expect(titleFromRow("habits", {})).toBe(ARCHIVE_LABELS.habits);
  });
});
