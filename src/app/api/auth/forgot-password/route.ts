import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/lib/auth/credentials";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  clientIp,
  maybeSweepRateLimits,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const schema = z.object({
  email: emailSchema,
});

export async function POST(request: NextRequest) {
  maybeSweepRateLimits();
  const ip = clientIp(request);
  const limited = checkRateLimit(`auth:forgot:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
  });

  // Rate limits are worth surfacing; anything else stays generic so the
  // endpoint can't be used to probe which emails are registered.
  if (error && /rate limit/i.test(error.message)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has a VIVRΛNT account, a reset link is on its way.",
  });
}
