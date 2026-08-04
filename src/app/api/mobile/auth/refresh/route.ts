export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerConfig } from "@/lib/supabase/admin";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";

const bodySchema = z.object({
  refresh_token: z.string().min(10, "Provide a valid refresh_token."),
});

export async function POST(request: Request) {
  const json = await readJson(request);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  const { url, publishableKey } = getServerConfig();
  if (!url || !publishableKey) {
    return jsonError("Authentication is temporarily unavailable.", 503);
  }

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: parsed.data.refresh_token,
  });

  if (error || !data.session || !data.user) {
    return jsonError("Could not refresh session.", 401);
  }

  // Refuse refresh for suspended accounts so stolen tokens cannot stay alive.
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await userClient
    .from("profiles")
    .select("status")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profile?.status === "suspended") {
    try {
      await userClient.auth.signOut();
    } catch {
      // Best-effort — client must still clear local tokens on 403.
    }
    return jsonError(
      "Your account has been suspended. Contact support if this is unexpected.",
      403,
    );
  }

  return jsonOk({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: { id: data.user.id, email: data.user.email ?? null },
  });
}
