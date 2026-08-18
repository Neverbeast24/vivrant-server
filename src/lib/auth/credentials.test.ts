import { describe, expect, it } from "vitest";
import {
  emailSchema,
  failedPasswordLoginCode,
  failedPasswordLoginMessage,
  normalizeEmail,
  parseLoginHints,
  signupConflictMessage,
} from "./credentials";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Alex@Gmail.COM ")).toBe("alex@gmail.com");
  });
});

describe("emailSchema", () => {
  it("accepts mixed-case emails with spaces", () => {
    const parsed = emailSchema.safeParse("  Alex@Gmail.COM ");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe("alex@gmail.com");
  });

  it("rejects invalid emails", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("parseLoginHints", () => {
  it("reads a hints payload", () => {
    expect(
      parseLoginHints({
        user_id: "abc",
        has_password: false,
        has_email_identity: false,
        providers: ["google"],
      }),
    ).toEqual({
      userId: "abc",
      hasPassword: false,
      hasEmailIdentity: false,
      providers: ["google"],
    });
  });

  it("returns null for junk", () => {
    expect(parseLoginHints(null)).toBeNull();
    expect(parseLoginHints({})).toBeNull();
  });
});

describe("failedPasswordLoginMessage", () => {
  it("points OAuth-only accounts at social login", () => {
    const hints = parseLoginHints({
      user_id: "abc",
      has_password: false,
      has_email_identity: false,
      providers: ["google"],
    });
    expect(failedPasswordLoginCode(hints)).toBe("oauth_only");
    expect(failedPasswordLoginMessage(hints)).toContain("Continue with Google");
    expect(failedPasswordLoginMessage(hints)).toContain("Forgot password");
  });

  it("keeps a generic mismatch when a password exists", () => {
    const hints = parseLoginHints({
      user_id: "abc",
      has_password: true,
      has_email_identity: true,
      providers: ["email", "google"],
    });
    expect(failedPasswordLoginCode(hints)).toBe("invalid_credentials");
    expect(failedPasswordLoginMessage(hints)).toContain("don't match");
  });
});

describe("signupConflictMessage", () => {
  it("mentions Google when the email is already an OAuth account", () => {
    const hints = parseLoginHints({
      user_id: "abc",
      has_password: false,
      has_email_identity: false,
      providers: ["google"],
    });
    expect(signupConflictMessage(hints)).toContain("via Google");
  });
});
