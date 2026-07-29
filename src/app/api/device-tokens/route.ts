import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(["web", "android", "ios"]),
});

async function getAuthedClient(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const accessToken = auth.slice(7).trim();
    const { url, publishableKey } = getServerConfig();
    if (!url || !publishableKey || !accessToken) return null;
    return createSupabaseClient(url, publishableKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient();
}

/**
 * Native Android / iOS apps register FCM tokens here after the user signs in
 * with Supabase. Prefer `Authorization: Bearer <access_token>` from the mobile
 * session. Browser clients can rely on cookies instead.
 */
export async function POST(request: Request) {
  const supabase = await getAuthedClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const accessToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const {
    data: { user },
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide token and platform (web|android|ios)." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("device_tokens").upsert(
    {
      user_id: user.id,
      token: parsed.data.token,
      platform: parsed.data.platform,
      last_seen_at: now,
    },
    { onConflict: "token" },
  );

  if (error) {
    console.error("device_tokens API upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save device token." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await getAuthedClient(request);
  if (!supabase) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const accessToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const {
    data: { user },
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = z.string().trim().min(20).max(4096).safeParse(
    (json as { token?: string })?.token,
  );
  if (!token.success) {
    return NextResponse.json({ error: "Provide token." }, { status: 400 });
  }

  const { error } = await supabase
    .from("device_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("token", token.data);

  if (error) {
    return NextResponse.json({ error: "Could not remove device token." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
