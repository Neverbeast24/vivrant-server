import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { parseLoginHints, type LoginHints } from "@/lib/auth/credentials";

function adminOrNull() {
  try {
    return createAdminClient();
  } catch (error) {
    logger.warn("auth/login-hints", "admin client unavailable", {
      internal: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getLoginHints(email: string): Promise<LoginHints | null> {
  const admin = adminOrNull();
  if (!admin) return null;
  const { data, error } = await admin.rpc("auth_login_hints", {
    lookup_email: email,
  });
  if (error) {
    logger.warn("auth/login-hints", "lookup failed", { internal: error.message });
    return null;
  }
  return parseLoginHints(data);
}

export async function ensureEmailIdentity(userId: string) {
  const admin = adminOrNull();
  if (!admin) return;
  const { error } = await admin.rpc("ensure_email_identity_for_user", {
    target_user_id: userId,
  });
  if (error) {
    logger.warn("auth/login-hints", "ensure identity failed", {
      internal: error.message,
    });
  }
}
