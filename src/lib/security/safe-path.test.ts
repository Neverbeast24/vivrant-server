import { describe, expect, it } from "vitest";
import { safeAppPath } from "./safe-path";

describe("safeAppPath", () => {
  it("keeps valid relative app paths", () => {
    expect(safeAppPath("/dashboard")).toBe("/dashboard");
    expect(safeAppPath("/dashboard/ai/reminders")).toBe("/dashboard/ai/reminders");
    expect(safeAppPath("/reset-password")).toBe("/reset-password");
  });

  it("rejects open redirects and schemes", () => {
    expect(safeAppPath("//evil.com")).toBe("/dashboard");
    expect(safeAppPath("https://evil.com")).toBe("/dashboard");
    expect(safeAppPath("/\\evil")).toBe("/dashboard");
    expect(safeAppPath("/dashboard?next=1")).toBe("/dashboard");
    expect(safeAppPath("dashboard")).toBe("/dashboard");
  });

  it("uses custom fallback", () => {
    expect(safeAppPath(null, "/login")).toBe("/login");
    expect(safeAppPath("", "/login")).toBe("/login");
    expect(safeAppPath("//x", "")).toBe("");
  });
});
