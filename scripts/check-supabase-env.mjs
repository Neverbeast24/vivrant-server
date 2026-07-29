/**
 * Validates viva-server/.env.local Supabase keys without printing secrets.
 * Usage: node scripts/check-supabase-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function classify(value, kind) {
  if (!value) return "missing";
  if (/your_key|changeme|placeholder|example|paste_/i.test(value)) {
    return "placeholder";
  }
  if (value.startsWith("eyJ")) return "legacy_jwt";
  if (kind === "publishable" && value.startsWith("sb_publishable_")) {
    return "sb_publishable";
  }
  if (kind === "secret" && value.startsWith("sb_secret_")) return "sb_secret";
  return "unknown";
}

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.example first.");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const pub =
  env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = env.SUPABASE_SECRET_KEY;

let host = null;
try {
  host = url ? new URL(url).host : null;
} catch {
  host = "invalid-url";
}

const pubKind = classify(pub, "publishable");
const secretKind = classify(secret, "secret");
const ok =
  Boolean(host) &&
  host !== "invalid-url" &&
  (pubKind === "sb_publishable" || pubKind === "legacy_jwt") &&
  (secretKind === "sb_secret" || secretKind === "legacy_jwt");

console.log(
  JSON.stringify(
    {
      ok,
      host,
      publishable: pubKind,
      secret: secretKind,
      pubEqualsNextPublic:
        env.SUPABASE_PUBLISHABLE_KEY ===
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    null,
    2,
  ),
);

if (!ok) {
  console.error(
    "\nFix: Supabase Dashboard → Project Settings → API Keys → copy Publishable + Secret into .env.local, then restart npm run dev.",
  );
  process.exit(1);
}

console.log("\nSupabase env looks configured.");
