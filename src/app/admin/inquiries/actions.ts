"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { sendInquiryPriceEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

const statusEnum = z.enum(["open", "in_progress", "resolved", "closed"]);

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: statusEnum,
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

function revalidateInquiries() {
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin", "layout");
}

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
  let emailError: string | null = null;
  let priceEmailedAt: string | null = null;
  let nextStatus = parsed.data.status;

  if (parsed.data.send_price_email && parsed.data.quoted_price != null) {
    // Quote send always closes the inquiry (reopen is available in the UI).
    nextStatus = "closed";
    const emailed = await sendInquiryPriceEmail({
      to: existing.email,
      name: existing.name,
      plan: existing.plan,
      pricePhp: parsed.data.quoted_price,
      inquiryId: existing.id,
      note: parsed.data.admin_note,
    });

    if (emailed.ok) {
      emailMessage = emailed.message;
      priceEmailedAt = new Date().toISOString();
    } else {
      emailError = emailed.message;
    }
  }

  const { error } = await supabase
    .from("contact_inquiries")
    .update({
      status: nextStatus,
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
      status: nextStatus,
      quoted_price: parsed.data.quoted_price,
      emailed: Boolean(emailMessage),
      email_failed: Boolean(emailError),
    },
  });

  revalidateInquiries();

  if (emailError) {
    return {
      ok: false,
      message: `Inquiry closed and quote saved, but email failed: ${emailError}`,
    };
  }

  return {
    ok: true,
    message: emailMessage
      ? `Quote sent and inquiry closed. ${emailMessage}`
      : nextStatus === "closed"
        ? "Inquiry closed."
        : "Inquiry updated.",
  };
}

export async function setContactInquiryStatus(formData: FormData) {
  await requireSuperAdmin();

  const parsed = z
    .object({
      id: z.coerce.number().int().positive(),
      status: statusEnum,
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
    });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_inquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("contact_inquiries status failed:", error.message);
    return { ok: false, message: "Could not update status." };
  }

  await writeAuditLog({
    action: "contact_inquiry_status_changed",
    entity: "contact_inquiries",
    metadata: { id: parsed.data.id, status: parsed.data.status },
  });

  revalidateInquiries();

  if (parsed.data.status === "open") {
    return { ok: true, message: "Inquiry reopened." };
  }
  if (parsed.data.status === "closed") {
    return { ok: true, message: "Inquiry closed." };
  }
  return { ok: true, message: `Status set to ${parsed.data.status.replaceAll("_", " ")}.` };
}
