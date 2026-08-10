export const runtime = "nodejs";

import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { getEmailConfigStatus } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileStaff } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { notifyUsers } from "@/lib/notifications/notify";

const broadcastSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  target: z.enum(["all", "one"]).default("all"),
  user_id: z.string().uuid().optional(),
});

function envFlags() {
  // Static process.env.* access is required — dynamic keys stay empty in Next.js.
  return {
    gemini: Boolean((process.env.GEMINI_API_KEY ?? "").trim()),
    firebase: Boolean((process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "").trim()),
    resend: getEmailConfigStatus().configured,
  };
}

/** System health + active members for broadcast. */
export async function GET(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const [{ error: dbError }, { data: members }, { count: noticeCount }] =
    await Promise.all([
      admin.from("profiles").select("user_id", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("user_id, display_name, email")
        .eq("status", "active")
        .order("display_name")
        .limit(500),
      admin.from("notifications").select("id", { count: "exact", head: true }),
    ]);

  const env = envFlags();

  return jsonOk({
    services: [
      {
        name: "Supabase database",
        detail: "Auth, Postgres, and row-level security",
        ok: !dbError,
      },
      {
        name: "Gemini AI engine",
        detail: "Personalized insights and coaching",
        ok: env.gemini,
      },
      {
        name: "Firebase messaging",
        detail: "Push notifications for reminders",
        ok: env.firebase,
      },
      {
        name: "Resend email",
        detail: "Inquiry quote emails",
        ok: env.resend,
      },
    ],
    noticeCount: noticeCount ?? 0,
    members: members ?? [],
  });
}

/** Broadcast an in-app notice to members. */
export async function POST(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  const parsed = broadcastSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid broadcast.", 400);
  }
  if (parsed.data.target === "one" && !parsed.data.user_id) {
    return jsonError("Choose a member for a direct notice.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  let userIds: string[] = [];
  if (parsed.data.target === "one" && parsed.data.user_id) {
    userIds = [parsed.data.user_id];
  } else {
    const { data, error } = await admin
      .from("profiles")
      .select("user_id")
      .eq("status", "active")
      .limit(2000);
    if (error) return jsonError(error.message, 500);
    userIds = (data ?? []).map((row) => row.user_id);
  }

  if (!userIds.length) return jsonError("No members to notify.", 400);

  const result = await notifyUsers({
    userIds,
    title: parsed.data.title,
    body: parsed.data.body,
    href: "/dashboard",
    asUserClient: auth.supabase,
  });

  if (!result.ok) {
    return jsonError(result.message ?? "Could not send notifications.", 500);
  }

  await writeAuditLog(
    {
      action: "notification_broadcast",
      entity: "notifications",
      metadata: {
        title: parsed.data.title,
        target: parsed.data.target,
        count: result.inserted,
        pushed: result.pushed,
      },
    },
    auth.supabase,
  );

  return jsonOk({
    inserted: result.inserted,
    pushed: result.pushed ?? 0,
    message: `Sent to ${result.inserted} member${result.inserted === 1 ? "" : "s"}.`,
  });
}
