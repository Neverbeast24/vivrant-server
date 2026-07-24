"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  admin_note: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.string().trim().max(1000).nullable(),
  ),
});

export async function updateContactInquiry(formData: FormData) {
  await requireSuperAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    admin_note: formData.get("admin_note"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid update." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_inquiries")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note,
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("contact_inquiries update failed:", error.message);
    return { ok: false, message: "Could not update inquiry." };
  }

  await writeAuditLog({
    action: "contact_inquiry_updated",
    entity: "contact_inquiries",
    metadata: { id: parsed.data.id, status: parsed.data.status },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true, message: "Inquiry updated." };
}
