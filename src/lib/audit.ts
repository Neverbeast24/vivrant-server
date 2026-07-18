"use server";

import { createClient } from "@/lib/supabase/server";

export async function writeAuditLog(input: {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}
