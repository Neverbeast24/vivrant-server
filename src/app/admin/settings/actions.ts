"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  target: z.enum(["all", "one"]),
  user_id: z.string().uuid().optional(),
});

export async function broadcastNotification(formData: FormData) {
  await requireStaff();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    target: formData.get("target") || "all",
    user_id: formData.get("user_id") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Enter a title, message, and valid target." };
  }
  if (parsed.data.target === "one" && !parsed.data.user_id) {
    return { ok: false, message: "Choose a member for a direct notice." };
  }

  const supabase = await createClient();
  let userIds: string[] = [];

  if (parsed.data.target === "one" && parsed.data.user_id) {
    userIds = [parsed.data.user_id];
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("status", "active")
      .limit(2000);
    if (error) return { ok: false, message: error.message };
    userIds = (data ?? []).map((row) => row.user_id);
  }

  if (!userIds.length) return { ok: false, message: "No members to notify." };

  const rows = userIds.map((user_id) => ({
    user_id,
    title: parsed.data.title,
    body: parsed.data.body,
    is_read: false,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "notification_broadcast",
    entity: "notifications",
    metadata: {
      title: parsed.data.title,
      target: parsed.data.target,
      count: rows.length,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: `Sent to ${rows.length} member${rows.length === 1 ? "" : "s"}.` };
}
