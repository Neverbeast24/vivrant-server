import { z } from "zod";
import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError, readJson } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { estimateGroceryCostWithAi } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
});

/** AI cost estimate for a single grocery line item. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter an item name first.", 400);

  try {
    const context = await buildUserContext(user.id, { supabase });
    const estimate = await estimateGroceryCostWithAi({
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      context,
    });
    return jsonOk({ estimate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not estimate cost right now.";
    return jsonError(message, 500);
  }
}
