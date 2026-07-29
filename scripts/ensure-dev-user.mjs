/**
 * Ensure a password login works for a given email (dev helper).
 *
 * Usage:
 *   node scripts/ensure-dev-user.mjs --email you@example.com --password 'YourPass123!'
 *
 * Loads SUPABASE_URL + SUPABASE_SECRET_KEY from .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const email = arg("email");
const password = arg("password");
if (!email || !password) {
  console.error(
    "Usage: node scripts/ensure-dev-user.mjs --email you@example.com --password 'YourPass123!'",
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!url || !secret || /placeholder|paste_/i.test(secret)) {
  console.error("Missing real SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

const existing = (listed.users ?? []).find(
  (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
);

if (!existing) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: email.split("@")[0] },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        action: "created",
        id: data.user?.id,
        email: data.user?.email,
        providers: data.user?.app_metadata?.providers ?? [],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const providers = [
  ...(existing.app_metadata?.providers ?? []),
  ...(existing.identities?.map((i) => i.provider) ?? []),
];
const uniqueProviders = [...new Set(providers)];

const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
  password,
  email_confirm: true,
});
if (error) {
  console.error("updateUserById failed:", error.message);
  console.error(
    JSON.stringify(
      { id: existing.id, email: existing.email, providers: uniqueProviders },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      action: "password_updated",
      id: data.user?.id,
      email: data.user?.email,
      providers: uniqueProviders,
      emailConfirmed: Boolean(data.user?.email_confirmed_at),
    },
    null,
    2,
  ),
);
