import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { jsonError, jsonOk, parseIdParam, readJson, todayDate } from "./http";

describe("parseIdParam", () => {
  it("parses numeric ids", () => {
    expect(parseIdParam("42")).toBe(42);
    expect(parseIdParam(["7"])).toBe(7);
  });

  it("rejects non-numeric values", () => {
    expect(parseIdParam("abc")).toBeNull();
    expect(parseIdParam(undefined)).toBeNull();
  });
});

describe("todayDate", () => {
  it("returns YYYY-MM-DD", () => {
    expect(todayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("readJson", () => {
  it("parses valid JSON bodies", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ ml: 250 }),
      headers: { "Content-Type": "application/json" },
    });
    await expect(readJson(req)).resolves.toEqual({ ml: 250 });
  });

  it("returns null for invalid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "{not-json",
      headers: { "Content-Type": "application/json" },
    });
    await expect(readJson(req)).resolves.toBeNull();
  });
});

describe("jsonOk / jsonError", () => {
  it("returns ok payloads", async () => {
    const res = jsonOk({ water_ml: 500 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, water_ml: 500 });
  });

  it("redacts internal database errors", async () => {
    const res = jsonError("permission denied for table profiles", 500, {
      requestId: "test-req",
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Something went wrong. Please try again.");
    expect(body.request_id).toBe("test-req");
    expect(body.error).not.toMatch(/permission denied/i);
  });

  it("keeps safe client validation messages", async () => {
    const res = jsonError("Provide ml (50-2000).", 400, { requestId: "v1" });
    const body = await res.json();
    expect(body.error).toBe("Provide ml (50-2000).");
  });
});
