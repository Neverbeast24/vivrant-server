import { z } from "zod";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.email("Enter a valid email address."));

export type LoginHints = {
  userId: string;
  hasPassword: boolean;
  hasEmailIdentity: boolean;
  providers: string[];
};

export function parseLoginHints(value: unknown): LoginHints | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const userId = typeof row.user_id === "string" ? row.user_id : "";
  if (!userId) return null;
  const providers = Array.isArray(row.providers)
    ? row.providers.filter((item): item is string => typeof item === "string")
    : [];
  return {
    userId,
    hasPassword: Boolean(row.has_password),
    hasEmailIdentity: Boolean(row.has_email_identity),
    providers,
  };
}

export function socialProviders(providers: string[]) {
  return providers.filter((item) => item === "google" || item === "github");
}

function providerLabel(providers: string[]) {
  const social = socialProviders(providers);
  if (social.includes("google") && social.includes("github")) {
    return "Google or GitHub";
  }
  if (social.includes("google")) return "Google";
  if (social.includes("github")) return "GitHub";
  return "Google or GitHub";
}

export function failedPasswordLoginMessage(hints: LoginHints | null) {
  const social = hints ? socialProviders(hints.providers) : [];
  if (hints && social.length > 0 && !hints.hasPassword) {
    const label = providerLabel(hints.providers);
    return `This account uses ${label}. Continue with ${label} below, or use Forgot password to add an email password.`;
  }
  if (hints?.hasPassword) {
    return "That email and password don't match. Try again, or reset your password below.";
  }
  return "That email and password don't match. If you signed up with Google or GitHub, use those buttons — or reset your password below.";
}

export function failedPasswordLoginCode(hints: LoginHints | null) {
  const social = hints ? socialProviders(hints.providers) : [];
  if (hints && social.length > 0 && !hints.hasPassword) return "oauth_only";
  return "invalid_credentials";
}

export function signupConflictMessage(hints: LoginHints | null) {
  const social = hints ? socialProviders(hints.providers) : [];
  if (social.length > 0) {
    const label = providerLabel(hints?.providers ?? []);
    return `This email already has a VIVRΛNT account via ${label}. Continue with ${label}, or use Forgot password to add an email password.`;
  }
  return "This email is already registered. Sign in instead, or reset your password.";
}
