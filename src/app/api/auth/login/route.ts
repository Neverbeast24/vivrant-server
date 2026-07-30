import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseConfigStatus,
  logSupabaseConfigOnce,
} from "@/lib/supabase/config-check";
import { logger } from "@/lib/logger";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "That email and password don't match. If you signed up with Google or GitHub, use those buttons — or reset your password below.";
  }
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

  const email = parsed.data.email;
  logger.info("auth/login", "attempt", { email, host: status.urlHost });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
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
  logger.info("auth/login", "ok", {
    email,
    user_id: data.user.id,
    has_profile: Boolean(profile),
    ms: Date.now() - started,
  });

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
    access_token: session?.access_token ?? null,
    refresh_token: session?.refresh_token ?? null,
    expires_in: session?.expires_in ?? null,
    expires_at: session?.expires_at ?? null,
    profile: profile ?? null,
  });
}
