/**
 * Writes real Supabase keys into .env.local (never logs the values).
 *
 * Usage:
 *   node scripts/set-supabase-keys.mjs --publishable sb_publishable_... --secret sb_secret_...
 *
 * Or with legacy JWT keys:
 *   node scripts/set-supabase-keys.mjs --publishable eyJ... --secret eyJ...
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const publishable = arg("publishable");
const secret = arg("secret");

if (!publishable || !secret) {
  console.error(
    "Usage: node scripts/set-supabase-keys.mjs --publishable <key> --secret <key>",
  );
  process.exit(1);
}

function isRealPublishable(v) {
  return v.startsWith("sb_publishable_") || v.startsWith("eyJ");
}
function isRealSecret(v) {
  return v.startsWith("sb_secret_") || v.startsWith("eyJ");
}
function isFake(v) {
  return /your_key|changeme|placeholder|example|paste_/i.test(v);
}

if (isFake(publishable) || isFake(secret)) {
  console.error(
    "Refusing to write placeholder text. Copy real keys from the Supabase dashboard.",
  );
  process.exit(1);
}
if (!isRealPublishable(publishable)) {
  console.error(
    "Publishable key must start with sb_publishable_ or eyJ (JWT). Get it from:\n" +
      "https://supabase.com/dashboard/project/gcqbuccazplfpmuhperg/settings/api-keys",
  );
  process.exit(1);
}
if (!isRealSecret(secret)) {
  console.error(
    "Secret key must start with sb_secret_ or eyJ (JWT). Get it from:\n" +
      "https://supabase.com/dashboard/project/gcqbuccazplfpmuhperg/settings/api-keys",
  );
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.example first.");
  process.exit(1);
}

let text = readFileSync(envPath, "utf8");

function upsert(key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, line);
  } else {
    text = `${text.trimEnd()}\n${line}\n`;
  }
}

upsert("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishable);
upsert("SUPABASE_PUBLISHABLE_KEY", publishable);
upsert("SUPABASE_SECRET_KEY", secret);

writeFileSync(envPath, text, "utf8");
console.log(
  "Updated .env.local (publishable + secret). Restart: npm run dev",
);
console.log("Then verify with: npm run check:supabase");
