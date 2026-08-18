import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  emailSchema,
  failedPasswordLoginCode,
  failedPasswordLoginMessage,
} from "@/lib/auth/credentials";
import {
  ensureEmailIdentity,
  getLoginHints,
} from "@/lib/auth/login-hints";
import { createClientForResponse } from "@/lib/supabase/server";
import {
  getSupabaseConfigStatus,
  logSupabaseConfigOnce,
} from "@/lib/supabase/config-check";
import { getServerConfig } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import {
  checkRateLimit,
  clientIp,
  maybeSweepRateLimits,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

function friendlyError(message: string) {
  if (/email not confirmed/i.test(message)) {
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link.";
  }
  if (/invalid api key/i.test(message)) {
    return "Authentication is temporarily unavailable. Please try again shortly.";
  }
  return "Sign in failed. Please try again.";
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  logSupabaseConfigOnce("login");
  maybeSweepRateLimits();

  const ip = clientIp(request);
  const limited = checkRateLimit(`auth:login:${ip}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    logger.warn("auth/login", "validation failed");
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const status = getSupabaseConfigStatus();
  if (!status.ok) {
    logger.error("auth/login", "supabase misconfigured", {
      publishable: status.publishable,
      secret: status.secret,
    });
    return NextResponse.json(
      {
        error: "Authentication is temporarily unavailable. Please try again shortly.",
        code: "supabase_misconfigured",
      },
      { status: 503 },
    );
  }

  const { email, password } = parsed.data;
  logger.info("auth/login", "attempt", { email, host: status.urlHost });

  const { url, publishableKey } = getServerConfig();
  if (!url || !publishableKey) {
    return NextResponse.json(
      {
        error: "Authentication is temporarily unavailable. Please try again shortly.",
        code: "supabase_misconfigured",
      },
      { status: 503 },
    );
  }

  // Isolated client so leftover cookies / PKCE state cannot fail a valid password.
  const authClient = createSupabaseClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error && /invalid login credentials/i.test(error.message)) {
    const hints = await getLoginHints(email);
    if (hints?.hasPassword && !hints.hasEmailIdentity) {
      await ensureEmailIdentity(hints.userId);
      const retry = await authClient.auth.signInWithPassword({ email, password });
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      logger.warn("auth/login", "failed", {
        email,
        ms: Date.now() - started,
        internal: error.message,
        code: failedPasswordLoginCode(hints),
      });
      return NextResponse.json(
        {
          error: failedPasswordLoginMessage(hints),
          code: failedPasswordLoginCode(hints),
        },
        { status: 401 },
      );
    }
  }

  if (error) {
    logger.warn("auth/login", "failed", {
      email,
      ms: Date.now() - started,
      internal: error.message,
    });
    return NextResponse.json(
      { error: friendlyError(error.message) },
      { status: 401 },
    );
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Sign in failed. Please try again." },
      { status: 401 },
    );
  }

  const { data: profile } = await authClient
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profile?.status === "suspended") {
    await authClient.auth.signOut();
    logger.warn("auth/login", "suspended account", {
      email,
      user_id: data.user.id,
    });
    return NextResponse.json(
      { error: "Your account has been suspended. Contact support if this is unexpected." },
      { status: 403 },
    );
  }

  const session = data.session;
  const payload = {
    ok: true as const,
    user: { id: data.user.id, email: data.user.email },
    access_token: session?.access_token ?? null,
    refresh_token: session?.refresh_token ?? null,
    expires_in: session?.expires_in ?? null,
    expires_at: session?.expires_at ?? null,
    profile: profile ?? null,
  };

  const response = NextResponse.json(payload);
  if (session) {
    try {
      const cookieClient = await createClientForResponse(response);
      await cookieClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch (cookieError) {
      logger.warn("auth/login", "cookie session not written", {
        internal:
          cookieError instanceof Error ? cookieError.message : String(cookieError),
      });
    }
  }

  logger.info("auth/login", "ok", {
    email,
    user_id: data.user.id,
    has_profile: Boolean(profile),
    ms: Date.now() - started,
  });

  return response;
}
