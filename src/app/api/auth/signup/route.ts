import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseConfigStatus,
  logSupabaseConfigOnce,
} from "@/lib/supabase/config-check";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use a password with at least 8 characters."),
  displayName: z.string().trim().max(80).optional().default(""),
});

export async function POST(request: NextRequest) {
  const started = Date.now();
  logSupabaseConfigOnce("signup");

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    console.warn("[vivrant:auth/signup] 400 validation");
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const status = getSupabaseConfigStatus();
  if (!status.ok) {
    console.error(
      `[vivrant:auth/signup] 503 misconfigured publishable=${status.publishable} secret=${status.secret}`,
    );
    return NextResponse.json(
      {
        error: status.message,
        code: "supabase_misconfigured",
        debug: {
          host: status.urlHost,
          publishable: status.publishable,
          secret: status.secret,
        },
      },
      { status: 503 },
    );
  }

  const { email, password, displayName } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.info(`[vivrant:auth/signup] attempt email=${email}`);

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
    console.warn(
      `[vivrant:auth/signup] fail email=${email} ms=${Date.now() - started} supabase="${error.message}"`,
    );
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase returns a user with an empty identities array when the email
  // is already registered (to avoid leaking accounts it doesn't error).
  if (data.user && data.user.identities?.length === 0) {
    console.warn(`[vivrant:auth/signup] conflict email=${email}`);
    return NextResponse.json(
      { error: "This email is already registered. Sign in instead, or reset your password." },
      { status: 409 },
    );
  }

  const needsConfirmation = !data.session;
  if (needsConfirmation) {
    console.info(
      `[vivrant:auth/signup] ok needs_confirm email=${email} ms=${Date.now() - started}`,
    );
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

  console.info(
    `[vivrant:auth/signup] ok email=${email} user=${data.user?.id} ms=${Date.now() - started}`,
  );

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
