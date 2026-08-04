import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMobileSupabase } from "@/lib/mobile/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const schema = z.object({
  password: z.string().min(8, "Use a password with at least 8 characters."),
});

function friendlyPasswordError(message: string) {
  if (/weak|at least|too short|password/i.test(message)) {
    return "Use a stronger password with at least 8 characters.";
  }
  if (/rate|limit|too many/i.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Could not update your password. Please try again.";
}

/**
 * Set a new password for an authenticated recovery or signed-in session.
 * Accepts web cookie sessions and mobile Bearer JWTs.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const supabase = await getMobileSupabase(request);
  if (!supabase) {
    return NextResponse.json(
      { error: "Your reset link has expired. Request a new one from the login page." },
      { status: 401 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const {
    data: { user },
    error: userError,
  } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your reset link has expired. Request a new one from the login page." },
      { status: 401 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logger.error("auth/reset-password", "Admin client unavailable", {
      internal: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  });

  if (error) {
    logger.warn("auth/reset-password", "update failed", { internal: error.message });
    return NextResponse.json({ error: friendlyPasswordError(error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Password updated. You're signed in." });
}
