/**
 * Lightweight production smoke checks for VIVRΛNT Web.
 * Usage: node scripts/qa-smoke.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.QA_BASE_URL || "https://viva-server-delta.vercel.app").replace(
  /\/$/,
  "",
);

const checks = [
  { name: "landing", path: "/", expectStatus: [200] },
  { name: "login page", path: "/login", expectStatus: [200] },
  { name: "firebase SW", path: "/api/firebase-messaging-sw", expectStatus: [200] },
  {
    name: "mobile today unauth",
    path: "/api/mobile/today",
    expectStatus: [401],
  },
  {
    name: "auth login validation",
    path: "/api/auth/login",
    method: "POST",
    body: {},
    expectStatus: [400],
  },
];

async function run() {
  const results = [];
  for (const check of checks) {
    const url = `${base}${check.path}`;
    const started = Date.now();
    try {
      const res = await fetch(url, {
        method: check.method || "GET",
        headers: check.body
          ? { "Content-Type": "application/json", Accept: "application/json" }
          : { Accept: "application/json, text/html" },
        body: check.body ? JSON.stringify(check.body) : undefined,
        redirect: "manual",
      });
      const ms = Date.now() - started;
      const ok = check.expectStatus.includes(res.status);
      results.push({
        name: check.name,
        ok,
        status: res.status,
        ms,
        url,
      });
      console.log(
        `${ok ? "PASS" : "FAIL"}  ${check.name}  status=${res.status}  ${ms}ms`,
      );
    } catch (error) {
      results.push({
        name: check.name,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        url,
      });
      console.log(`FAIL  ${check.name}  ${error}`);
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nSmoke base: ${base}`);
  console.log(`Passed ${results.length - failed}/${results.length}`);
  process.exit(failed ? 1 : 0);
}

run();
