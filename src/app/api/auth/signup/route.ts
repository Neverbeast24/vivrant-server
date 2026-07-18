import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use a password with at least 8 characters."),
  displayName: z.string().trim().max(80).optional().default(""),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { email, password, displayName } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase returns a user with an empty identities array when the email
  // is already registered (to avoid leaking accounts it doesn't error).
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "This email is already registered. Sign in instead, or reset your password." },
      { status: 409 },
    );
  }

  const needsConfirmation = !data.session;
  return NextResponse.json({
    ok: true,
    needsConfirmation,
    message: needsConfirmation
      ? "Check your inbox to confirm your VIVA account."
      : "Account created. Welcome to VIVA!",
  });
}
