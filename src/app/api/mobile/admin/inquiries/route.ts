export const runtime = "nodejs";

import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileSuperAdmin } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { sendInquiryPriceEmail } from "@/lib/email/send";

const updateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.string().trim().max(1000).nullable().optional(),
  quoted_price: z.number().min(0).max(1_000_000).nullable().optional(),
  send_price_email: z.boolean().optional().default(false),
});

/** Super-admin contact inquiries. */
export async function GET(request: Request) {
  const auth = await requireMobileSuperAdmin(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data, error } = await admin
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ inquiries: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileSuperAdmin(request);
  if (isMobileAuthError(auth)) return auth;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid update.", 400);
  }
  if (parsed.data.send_price_email && parsed.data.quoted_price == null) {
    return jsonError("Enter a price before sending the quote email.", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const { data: existing, error: loadError } = await admin
    .from("contact_inquiries")
    .select("id, name, email, plan, quoted_price, price_emailed_at, admin_note")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !existing) return jsonError("Inquiry not found.", 404);

  let priceEmailedAt: string | null = existing.price_emailed_at ?? null;
  if (parsed.data.send_price_email && parsed.data.quoted_price != null) {
    const emailed = await sendInquiryPriceEmail({
      to: existing.email,
      name: existing.name,
      plan: existing.plan,
      pricePhp: parsed.data.quoted_price,
      inquiryId: existing.id,
      note: parsed.data.admin_note ?? existing.admin_note,
    });
    if (!emailed.ok) return jsonError(emailed.message, 500);
    priceEmailedAt = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("contact_inquiries")
    .update({
      status: parsed.data.status,
      admin_note:
        parsed.data.admin_note === undefined
          ? existing.admin_note
          : parsed.data.admin_note,
      quoted_price:
        parsed.data.quoted_price === undefined
          ? existing.quoted_price
          : parsed.data.quoted_price,
      price_emailed_at: priceEmailedAt,
    })
    .eq("id", parsed.data.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  await writeAuditLog(
    {
      action: "contact_inquiry_updated",
      entity: "contact_inquiries",
      entityId: String(parsed.data.id),
      metadata: { status: parsed.data.status },
    },
    auth.supabase,
  );

  return jsonOk({ inquiry: data });
}
