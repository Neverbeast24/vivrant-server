import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clientIp,
} from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test:allow:${Math.random()}`;
    const first = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    const second = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("blocks after the limit", () => {
    const key = `test:block:${Math.random()}`;
    checkRateLimit(key, { limit: 1, windowMs: 60_000 });
    const blocked = checkRateLimit(key, { limit: 1, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(request)).toBe("1.2.3.4");
  });
});
