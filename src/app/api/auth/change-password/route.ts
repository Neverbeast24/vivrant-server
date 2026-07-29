import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMobileSupabase } from "@/lib/mobile/auth";
import { createAdminClient, getServerConfig } from "@/lib/supabase/admin";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: z.string().min(8, "Use a password with at least 8 characters."),
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "New password must be different from your current password.",
    path: ["password"],
  });

function hasEmailPassword(user: {
  identities?: { provider?: string }[] | null;
  app_metadata?: { providers?: string[] } | null;
}) {
  if (user.identities?.some((identity) => identity.provider === "email")) {
    return true;
  }
  return user.app_metadata?.providers?.includes("email") ?? false;
}

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
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
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

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!hasEmailPassword(user)) {
    return NextResponse.json(
      {
        error:
          "This account signs in with Google or GitHub. Use Forgot password on the login page if you want to add an email password.",
      },
      { status: 400 },
    );
  }

  const { url, publishableKey } = getServerConfig();
  if (!url || !publishableKey) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  // Verify on an ephemeral client so we do not replace the caller's session.
  const verifyClient = createSupabaseClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  // Admin update works for both cookie (web) and Bearer (mobile) sessions.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Password updated.",
  });
}
