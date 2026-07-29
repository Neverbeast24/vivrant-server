import { getServerConfig } from "@/lib/supabase/admin";

export type SupabaseConfigStatus = {
  ok: boolean;
  urlHost: string | null;
  publishable: "missing" | "placeholder" | "legacy_jwt" | "sb_publishable" | "unknown";
  secret: "missing" | "placeholder" | "legacy_jwt" | "sb_secret" | "unknown";
  message: string | null;
};

function classifyKey(
  value: string | undefined,
  kind: "publishable" | "secret",
): SupabaseConfigStatus["publishable"] | SupabaseConfigStatus["secret"] {
  if (!value || !value.trim()) return "missing";
  const v = value.trim();
  if (/your_key|changeme|placeholder|example|paste_/i.test(v)) {
    return "placeholder";
  }
  if (v.startsWith("eyJ")) return "legacy_jwt";
  if (kind === "publishable" && v.startsWith("sb_publishable_")) {
    return "sb_publishable";
  }
  if (kind === "secret" && v.startsWith("sb_secret_")) return "sb_secret";
  return "unknown";
}

/** Safe status for logs / API responses — never includes key material. */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, publishableKey } = getServerConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const publishable = classifyKey(publishableKey, "publishable");
  const secret = classifyKey(secretKey, "secret");

  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }

  const publishableOk =
    publishable === "sb_publishable" || publishable === "legacy_jwt";
  const secretOk = secret === "sb_secret" || secret === "legacy_jwt";
  const broken = !urlHost || !publishableOk || !secretOk;

  let message: string | null = null;
  if (broken) {
    message =
      "Supabase keys in viva-server/.env.local are missing or still placeholders. " +
      "Open https://supabase.com/dashboard/project/gcqbuccazplfpmuhperg/settings/api-keys " +
      "and set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then restart npm run dev.";
  }

  return {
    ok: !broken,
    urlHost,
    publishable,
    secret,
    message,
  };
}

let loggedOnce = false;

/** Print a one-line config summary to the Next.js terminal (dev). */
export function logSupabaseConfigOnce(context = "boot") {
  if (loggedOnce && process.env.NODE_ENV === "production") return;
  loggedOnce = true;
  const status = getSupabaseConfigStatus();
  const line = `[vivrant:supabase] ${context} ok=${status.ok} host=${status.urlHost ?? "none"} publishable=${status.publishable} secret=${status.secret}`;
  if (status.ok) {
    console.info(line);
  } else {
    console.error(line);
    console.error(`[vivrant:supabase] ${status.message}`);
  }
}
