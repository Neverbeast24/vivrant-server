import { NextResponse, type NextRequest } from "next/server";
import { runScheduledBackups } from "@/lib/backup";
import { logger } from "@/lib/logger";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    logger.error("cron/backup", "CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Cron is not configured.", code: "cron_misconfigured" },
      { status: 503, headers: NO_STORE },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  const result = await runScheduledBackups();
  return NextResponse.json(result, { headers: NO_STORE });
}
