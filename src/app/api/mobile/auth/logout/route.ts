export const runtime = "nodejs";

import { getMobileSupabase } from "@/lib/mobile/auth";
import { jsonOk } from "@/lib/mobile/http";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (bearer) {
      try {
        const admin = createAdminClient();
        // Admin signOut expects the access JWT and can revoke globally.
        await admin.auth.admin.signOut(bearer, "global");
      } catch {
        const supabase = await getMobileSupabase(request);
        if (supabase) await supabase.auth.signOut({ scope: "global" });
      }
    } else {
      const supabase = await getMobileSupabase(request);
      if (supabase) await supabase.auth.signOut({ scope: "global" });
    }
  } catch {
    // Logging out should always succeed from the client's perspective.
  }

  return jsonOk();
}
