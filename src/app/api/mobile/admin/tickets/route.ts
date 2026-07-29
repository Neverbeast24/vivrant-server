export const runtime = "nodejs";

import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileStaff } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { notifyUsers } from "@/lib/notifications/notify";

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.string().trim().max(1000).nullable().optional(),
});

/** List all support tickets for staff. */
export async function GET(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data, error } = await admin
    .from("support_tickets")
    .select(
      "id, user_id, category, priority, subject, description, page_url, status, admin_note, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return jsonError(error.message, 500);

  const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds)
    : { data: [] as { user_id: string; display_name: string; email: string | null }[] };

  const profileMap = new Map((profiles ?? []).map((row) => [row.user_id, row]));

  const tickets = (data ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      ...row,
      display_name: profile?.display_name ?? "Unknown member",
      email: profile?.email ?? null,
    };
  });

  return jsonOk({ tickets });
}

/** Update ticket status / staff note. */
export async function PATCH(request: Request) {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid update.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data: existing, error: loadError } = await admin
    .from("support_tickets")
    .select("user_id, subject, status, admin_note, resolved_at")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError) return jsonError(loadError.message, 500);
  if (!existing) return jsonError("Ticket not found.", 404);

  const nextResolved =
    parsed.data.status === "resolved" || parsed.data.status === "closed";
  const wasResolved =
    existing.status === "resolved" || existing.status === "closed";

  let resolved_at: string | null = existing.resolved_at;
  if (nextResolved && !wasResolved) {
    resolved_at = new Date().toISOString();
  } else if (!nextResolved) {
    resolved_at = null;
  }

  const adminNote =
    parsed.data.admin_note === undefined
      ? existing.admin_note
      : parsed.data.admin_note;

  const { data, error } = await admin
    .from("support_tickets")
    .update({
      status: parsed.data.status,
      admin_note: adminNote,
      resolved_at,
    })
    .eq("id", parsed.data.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  const statusChanged = existing.status !== parsed.data.status;
  const noteChanged = (existing.admin_note ?? null) !== (adminNote ?? null);
  if (statusChanged || noteChanged) {
    const statusLabel = parsed.data.status.replaceAll("_", " ");
    const body = adminNote
      ? `Status: ${statusLabel}. Staff note: ${adminNote}`
      : `Your ticket “${existing.subject}” is now ${statusLabel}.`;
    try {
      await notifyUsers({
        userIds: [existing.user_id],
        title: `Ticket #${parsed.data.id} updated`,
        body: body.slice(0, 500),
        href: "/dashboard/support",
      });
    } catch (notifyError) {
      console.error("member ticket notify failed:", notifyError);
    }
  }

  await writeAuditLog(
    {
      action: "support_ticket_updated",
      entity: "support_tickets",
      entityId: String(parsed.data.id),
      metadata: { status: parsed.data.status },
    },
    auth.supabase,
  );

  return jsonOk({ ticket: data });
}
