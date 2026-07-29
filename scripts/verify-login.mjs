/**
 * Verify password login for a user (dev helper).
 * Usage: node scripts/verify-login.mjs --email you@example.com --password 'Pass123!'
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
    "Usage: node scripts/verify-login.mjs --email you@example.com --password 'Pass'",
  );
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const pub =
  env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = env.SUPABASE_SECRET_KEY;

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(url, pub, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listError) {
  console.error("listUsers:", listError.message);
  process.exit(1);
}
const user = (listed.users ?? []).find(
  (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
);
if (!user) {
  console.log(JSON.stringify({ found: false }));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      found: true,
      id: user.id,
      providers: user.app_metadata?.providers ?? [],
      identities: (user.identities || []).map((i) => i.provider),
      emailConfirmed: Boolean(user.email_confirmed_at),
    },
    null,
    2,
  ),
);

const { data, error } = await anon.auth.signInWithPassword({ email, password });
if (error) {
  console.log(JSON.stringify({ login: "fail", message: error.message }));
  process.exit(1);
}
console.log(
  JSON.stringify({
    login: "ok",
    userId: data.user?.id,
    hasSession: Boolean(data.session),
  }),
);
