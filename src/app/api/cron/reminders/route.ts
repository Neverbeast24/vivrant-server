import { NextResponse, type NextRequest } from "next/server";
import { processDueReminders } from "@/lib/reminders/process";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueReminders({ limit: 200 });
  return NextResponse.json(result);
}
