"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { sendInquiryPriceEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().trim().max(1000).nullable(),
  ),
  quoted_price: z.preprocess((value) => {
    if (value === "" || value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }, z.number().min(0).max(1_000_000).nullable()),
  send_price_email: z.preprocess(
    (value) => value === "on" || value === "true" || value === "1",
    z.boolean(),
  ),
});

export async function updateContactInquiry(formData: FormData) {
  await requireSuperAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    admin_note: formData.get("admin_note"),
    quoted_price: formData.get("quoted_price"),
    send_price_email: formData.get("send_price_email"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid update." };
  }

  if (parsed.data.send_price_email && parsed.data.quoted_price == null) {
    return {
      ok: false,
      message: "Enter a price (₱) before sending the quote email.",
    };
  }

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("contact_inquiries")
    .select("id, name, email, plan, quoted_price, price_emailed_at")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !existing) {
    console.error("contact_inquiries load failed:", loadError?.message);
    return { ok: false, message: "Inquiry not found." };
  }

  let emailMessage: string | null = null;
  let priceEmailedAt: string | null = null;

  if (parsed.data.send_price_email && parsed.data.quoted_price != null) {
    const emailed = await sendInquiryPriceEmail({
      to: existing.email,
      name: existing.name,
      plan: existing.plan,
      pricePhp: parsed.data.quoted_price,
      inquiryId: existing.id,
      note: parsed.data.admin_note,
    });

    if (!emailed.ok) {
      return { ok: false, message: emailed.message };
    }

    emailMessage = emailed.message;
    priceEmailedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from("contact_inquiries")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note,
      quoted_price: parsed.data.quoted_price,
      ...(priceEmailedAt ? { price_emailed_at: priceEmailedAt } : {}),
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("contact_inquiries update failed:", error.message);
    return {
      ok: false,
      message: emailMessage
        ? `Email sent, but saving failed: ${error.message}`
        : "Could not update inquiry.",
    };
  }

  await writeAuditLog({
    action: "contact_inquiry_updated",
    entity: "contact_inquiries",
    metadata: {
      id: parsed.data.id,
      status: parsed.data.status,
      quoted_price: parsed.data.quoted_price,
      emailed: Boolean(emailMessage),
    },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return {
    ok: true,
    message: emailMessage
      ? `Inquiry updated. ${emailMessage}`
      : "Inquiry updated.",
  };
}
