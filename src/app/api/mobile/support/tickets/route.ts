export const runtime = "nodejs";

import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { notifyStaff } from "@/lib/notifications/notify";

const TICKET_RATE_LIMIT = 5;
const TICKET_RATE_WINDOW_MS = 60 * 60 * 1000;

const ticketSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(2000),
  category: z.enum(["bug", "feature", "account", "other"]).optional().default("other"),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

/** List the member's own support tickets. */
export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ tickets: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const rawBody = await readJson(request);
  const parsed = ticketSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid ticket details.", 400);
  }

  const windowStart = new Date(Date.now() - TICKET_RATE_WINDOW_MS).toISOString();
  const { count: recentCount, error: rateError } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", windowStart);

  if (rateError) return jsonError("Could not submit your ticket. Please try again.", 500);
  if ((recentCount ?? 0) >= TICKET_RATE_LIMIT) {
    return jsonError(
      `Please wait before sending more tickets (max ${TICKET_RATE_LIMIT} per hour).`,
      429,
    );
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      category: parsed.data.category,
      priority: parsed.data.priority,
      subject: parsed.data.subject,
      description: parsed.data.body,
      status: "open",
    })
    .select("*")
    .single();

  if (error) return jsonError("Could not submit your ticket. Please try again.", 500);

  const priorityLabel =
    parsed.data.priority === "high"
      ? "High priority"
      : parsed.data.priority === "low"
        ? "Low priority"
        : "Normal priority";

  try {
    await notifyStaff({
      title: "New support ticket",
      body: `#${ticket.id} · ${priorityLabel} · ${parsed.data.subject}`,
      href: "/admin/tickets",
    });
  } catch (notifyError) {
    console.error("staff ticket notify failed:", notifyError);
  }

  await writeAuditLog(
    {
      action: "support_ticket_submitted",
      entity: "support_tickets",
      entityId: String(ticket.id),
      metadata: {
        category: parsed.data.category,
        priority: parsed.data.priority,
        subject: parsed.data.subject,
      },
    },
    supabase,
  );

  return jsonOk({ ticket }, 201);
}
