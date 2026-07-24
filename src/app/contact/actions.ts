"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { notifyStaff } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const inquirySchema = z.object({
  plan: z.enum(["general", "plus", "campus"]),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  organization: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().trim().max(160).nullable(),
  ),
  message: z.string().trim().min(5).max(4000),
});

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function submitContactInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    plan: formData.get("plan") || "general",
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Please complete the inquiry form.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("contact inquiry admin client failed:", error);
    return {
      ok: false as const,
      message: "Inquiry service is temporarily unavailable. Please try again later.",
    };
  }

  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count: recentCount, error: rateError } = await admin
    .from("contact_inquiries")
    .select("id", { count: "exact", head: true })
    .ilike("email", parsed.data.email)
    .gte("created_at", windowStart);

  if (rateError) {
    console.error("contact_inquiries rate check failed:", rateError.message);
    return { ok: false as const, message: "Could not send your inquiry. Please try again." };
  }
  if ((recentCount ?? 0) >= RATE_LIMIT) {
    return {
      ok: false as const,
      message: `Please wait before sending more inquiries (max ${RATE_LIMIT} per hour).`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await admin
    .from("contact_inquiries")
    .insert({
      plan: parsed.data.plan,
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
      message: parsed.data.message,
      user_id: user?.id ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("contact_inquiries insert failed:", error.message);
    return { ok: false as const, message: "Could not send your inquiry. Please try again." };
  }

  try {
    await notifyStaff({
      title: "New contact inquiry",
      body: `#${data.id} · ${parsed.data.plan} · ${parsed.data.name}`,
      href: "/admin/inquiries",
    });
  } catch (notifyError) {
    console.error("staff inquiry notify failed:", notifyError);
  }

  try {
    await writeAuditLog({
      action: "contact_inquiry_submitted",
      entity: "contact_inquiries",
      metadata: { id: data.id, plan: parsed.data.plan },
    });
  } catch {
    /* optional for guests */
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  redirect(`/contact/sent?id=${data.id}`);
}
