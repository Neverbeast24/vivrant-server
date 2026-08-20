import { describe, expect, it } from "vitest";
import { formatActivityItem, parseAuditMetadata } from "./activity-format";

describe("activity format", () => {
  it("parses the audit_logs_rows.json export shape", () => {
    const item = formatActivityItem({
      id: 105,
      actor_id: "60831162-2daf-46f7-ac4a-18f1d7cf2bce",
      action: "gym_plan_updated",
      entity: "gym_plans",
      entity_id: "11",
      metadata: '{"days": 6, "title": "6-Day Intermediate Fat Loss & Strength Retention Routine"}',
      created_at: "2026-08-19 15:22:36.655213+00",
    });

    expect(parseAuditMetadata(item.metadata).title).toBe(
      "6-Day Intermediate Fat Loss & Strength Retention Routine",
    );
    expect(item.title).toBe("6-Day Intermediate Fat Loss & Strength Retention Routine");
    expect(item.detail).toContain("Gym plan updated");
    expect(item.detail).toContain("6 days");
  });
});
