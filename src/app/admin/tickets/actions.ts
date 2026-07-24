"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/roles";
import { notifyUsers } from "@/lib/notifications/notify";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().trim().max(1000).nullable(),
  ),
});

export async function updateSupportTicket(formData: FormData) {
  await requireStaff();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    admin_note: formData.get("admin_note"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid update." };
  }

  const supabase = await createClient();

  const { data: existing, error: loadError } = await supabase
    .from("support_tickets")
    .select("user_id, subject, status, admin_note, resolved_at")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError) {
    console.error("support_tickets load failed:", loadError.message);
    return { ok: false, message: "Could not load this ticket. Please try again." };
  }
  if (!existing) return { ok: false, message: "Ticket not found." };

  const nextResolved =
    parsed.data.status === "resolved" || parsed.data.status === "closed";
  const wasResolved =
    existing.status === "resolved" || existing.status === "closed";

  // Only stamp resolved_at on first transition into resolved/closed.
  // Reopening clears it; note-only updates keep the original timestamp.
  let resolved_at: string | null = existing.resolved_at;
  if (nextResolved && !wasResolved) {
    resolved_at = new Date().toISOString();
  } else if (!nextResolved) {
    resolved_at = null;
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note,
      resolved_at,
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("support_tickets update failed:", error.message);
    return { ok: false, message: "Could not update this ticket. Please try again." };
  }

  const statusChanged = existing.status !== parsed.data.status;
  const noteChanged = (existing.admin_note ?? null) !== parsed.data.admin_note;
  if (statusChanged || noteChanged) {
    const statusLabel = parsed.data.status.replaceAll("_", " ");
    const body = parsed.data.admin_note
      ? `Status: ${statusLabel}. Staff note: ${parsed.data.admin_note}`
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

  revalidatePath("/admin/tickets");
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard");
  await writeAuditLog({
    action: "support_ticket_updated",
    entity: "support_tickets",
    entityId: String(parsed.data.id),
    metadata: {
      status: parsed.data.status,
    },
  });

  return { ok: true, message: "Ticket updated." };
}
