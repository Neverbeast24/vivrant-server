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
    return jsonError("Server auth is not configured.", 500);
  }

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: parsed.data.refresh_token,
  });

  if (error || !data.session) {
    return jsonError(error?.message ?? "Could not refresh session.", 401);
  }

  return jsonOk({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: data.user,
  });
}
