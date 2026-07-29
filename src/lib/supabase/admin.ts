import { createClient } from "@supabase/supabase-js";

function getServerConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return { url, publishableKey };
}

/** True when .env still has example placeholders — login will always fail. */
export function hasPlaceholderSupabaseKeys() {
  const { publishableKey } = getServerConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
  const bad = (v: string, kind: "publishable" | "secret") => {
    if (!v.trim() || /your_key|changeme|placeholder|example|paste_/i.test(v)) {
      return true;
    }
    if (v.startsWith("eyJ")) return false;
    if (kind === "publishable") return !v.startsWith("sb_publishable_");
    return !v.startsWith("sb_secret_");
  };
  return bad(publishableKey ?? "", "publishable") || bad(secretKey, "secret");
}

/** Service-role client — server only. Bypasses RLS. Never import in client code. */
export function createAdminClient() {
  const { url } = getServerConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in server environment.",
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { getServerConfig };
