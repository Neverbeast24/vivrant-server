import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  return message;
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return NextResponse.json(
      { error: friendlyError(error.message) },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email },
  });
}
