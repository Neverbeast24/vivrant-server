import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailSchema, signupConflictMessage } from "@/lib/auth/credentials";
import { getLoginHints } from "@/lib/auth/login-hints";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseConfigStatus,
  logSupabaseConfigOnce,
} from "@/lib/supabase/config-check";
import { logger } from "@/lib/logger";
import {
  checkRateLimit,
  clientIp,
  maybeSweepRateLimits,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const schema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Use a password with at least 8 characters."),
  displayName: z.string().trim().max(80).optional().default(""),
});

function friendlySignupError(message: string) {
  if (/already registered|already been registered|user already/i.test(message)) {
    return "This email is already registered. Sign in instead, or use Forgot password.";
  }
  if (/password/i.test(message)) {
    return "Use a stronger password (at least 8 characters).";
  }
  if (/invalid api key/i.test(message)) {
    return "Sign-up is temporarily unavailable. Please try again shortly.";
  }
  return "Could not create your account. Please try again.";
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  logSupabaseConfigOnce("signup");
  maybeSweepRateLimits();

  const ip = clientIp(request);
  const limited = checkRateLimit(`auth:signup:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    logger.warn("auth/signup", "validation failed");
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const status = getSupabaseConfigStatus();
  if (!status.ok) {
    logger.error("auth/signup", "supabase misconfigured", {
      publishable: status.publishable,
      secret: status.secret,
    });
    return NextResponse.json(
      {
        error: "Sign-up is temporarily unavailable. Please try again shortly.",
        code: "supabase_misconfigured",
      },
      { status: 503 },
    );
  }

  const { email, password, displayName } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  logger.info("auth/signup", "attempt", { email });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${appUrl}/auth/confirm`,
    },
  });

  if (error) {
    logger.warn("auth/signup", "failed", {
      email,
      ms: Date.now() - started,
      internal: error.message,
    });
    const conflict = /already registered|already been registered|user already/i.test(
      error.message,
    );
    const hints = conflict ? await getLoginHints(email) : null;
    return NextResponse.json(
      {
        error: conflict
          ? signupConflictMessage(hints)
          : friendlySignupError(error.message),
      },
      { status: 400 },
    );
  }

  // Supabase returns a user with an empty identities array when the email
  // is already registered (to avoid leaking accounts it doesn't error).
  if (data.user && data.user.identities?.length === 0) {
    logger.warn("auth/signup", "conflict", { email });
    const hints = await getLoginHints(email);
    return NextResponse.json(
      { error: signupConflictMessage(hints) },
      { status: 409 },
    );
  }

  const needsConfirmation = !data.session;
  if (needsConfirmation) {
    logger.info("auth/signup", "needs confirmation", {
      email,
      ms: Date.now() - started,
    });
    return NextResponse.json({
      ok: true,
      needs_email_confirmation: true,
      needsConfirmation: true,
      message: "Check your inbox to confirm your VIVRΛNT account.",
    });
  }

  const { data: profile } = data.user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle()
    : { data: null };

  logger.info("auth/signup", "ok", {
    email,
    user_id: data.user?.id,
    ms: Date.now() - started,
  });

  return NextResponse.json({
    ok: true,
    needs_email_confirmation: false,
    needsConfirmation: false,
    message: "Account created. Welcome to VIVRΛNT!",
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    access_token: data.session?.access_token ?? null,
    refresh_token: data.session?.refresh_token ?? null,
    expires_in: data.session?.expires_in ?? null,
    expires_at: data.session?.expires_at ?? null,
    profile: profile ?? null,
  });
}
