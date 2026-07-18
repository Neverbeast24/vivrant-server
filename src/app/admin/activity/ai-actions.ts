"use server";

import { buildUserContext } from "@/lib/ai/context";
import { summarizeMemberWeek } from "@/lib/ai/gemini";
import { requireSuperAdmin } from "@/lib/auth/roles";

export async function summarizeMemberWithAi(memberId: string) {
  await requireSuperAdmin();
  if (!memberId) return { ok: false, message: "Pick a member first." };

  try {
    const context = await buildUserContext(memberId, { memberId });
    const summary = await summarizeMemberWeek(context);
    return { ok: true, message: "Member summary ready.", summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not summarize this member.";
    return { ok: false, message };
  }
}
