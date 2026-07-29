export const runtime = "nodejs";

import { getMobileSupabase } from "@/lib/mobile/auth";
import { jsonOk } from "@/lib/mobile/http";

export async function POST(request: Request) {
  try {
    const supabase = await getMobileSupabase(request);
    if (supabase) await supabase.auth.signOut();
  } catch {
    // Logging out should always succeed from the client's perspective.
  }

  return jsonOk();
}
