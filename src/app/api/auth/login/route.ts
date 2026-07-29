import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseConfigStatus,
  logSupabaseConfigOnce,
} from "@/lib/supabase/config-check";

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
    return (
      getSupabaseConfigStatus().message ??
      "Server Supabase API key is invalid. Check viva-server/.env.local and restart the backend."
    );
  }
  return message;
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  logSupabaseConfigOnce("login");

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    console.warn(
      `[vivrant:auth/login] 400 validation email=${typeof body?.email === "string" ? body.email : "(none)"}`,
    );
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const status = getSupabaseConfigStatus();
  if (!status.ok) {
    console.error(
      `[vivrant:auth/login] 503 misconfigured publishable=${status.publishable} secret=${status.secret}`,
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

  const email = parsed.data.email;
  console.info(`[vivrant:auth/login] attempt email=${email} host=${status.urlHost}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.warn(
      `[vivrant:auth/login] fail email=${email} ms=${Date.now() - started} supabase="${error.message}"`,
    );
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
    console.warn(
      `[vivrant:auth/login] suspended email=${email} user=${data.user.id}`,
    );
    return NextResponse.json(
      { error: "Your account has been suspended. Contact support if this is unexpected." },
      { status: 403 },
    );
  }

  const session = data.session;
  console.info(
    `[vivrant:auth/login] ok email=${email} user=${data.user.id} hasProfile=${Boolean(profile)} ms=${Date.now() - started}`,
  );

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
