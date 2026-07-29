import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type MobileAuth = {
  supabase: SupabaseClient;
  user: User;
  profile: Profile;
};

function bearerClient(accessToken: string) {
  const { url, publishableKey } = getServerConfig();
  if (!url || !publishableKey) return null;
  return createSupabaseClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unauthorized() {
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

/** Prefer Bearer JWT (mobile); fall back to cookie session (web/dev). */
export async function getMobileSupabase(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const accessToken = auth.slice(7).trim();
    if (!accessToken) return null;
    return bearerClient(accessToken);
  }
  return createClient();
}

/**
 * Resolve the signed-in member for `/api/mobile/*`.
 * Rejects missing auth (401) and suspended profiles (403).
 */
export async function requireMobileUser(
  request: Request,
): Promise<MobileAuth | NextResponse> {
  const authHeader = request.headers.get("authorization");
  let supabase: SupabaseClient | null = null;
  let user: User | null = null;

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) return unauthorized();

    supabase = bearerClient(accessToken);
    if (!supabase) return unauthorized();

    // Pass the JWT explicitly — global Authorization alone is unreliable
    // when there is no persisted session (see Supabase getUser docs).
    const {
      data: { user: bearerUser },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !bearerUser) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[vivrant:mobile-auth] bearer rejected: ${userError?.message ?? "no user"}`,
        );
      }
      return unauthorized();
    }
    user = bearerUser;
  } else {
    if (process.env.NODE_ENV === "development") {
      console.warn("[vivrant:mobile-auth] missing Authorization Bearer header");
    }
    supabase = await createClient();
    const {
      data: { user: cookieUser },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !cookieUser) return unauthorized();
    user = cookieUser;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.status === "suspended") {
    return NextResponse.json(
      { error: "Your account has been suspended. Contact support if this is unexpected." },
      { status: 403 },
    );
  }

  return { supabase, user, profile: profile as Profile };
}

export function isMobileAuthError(
  value: MobileAuth | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}

export function isStaffRole(role: string | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined) {
  return role === "super_admin";
}

/** Staff-only `/api/mobile/admin/*` gate (admin + super_admin). */
export async function requireMobileStaff(
  request: Request,
): Promise<MobileAuth | NextResponse> {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  if (!isStaffRole(auth.profile.role)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }
  return auth;
}

/** Super-admin-only gate for activity + inquiries. */
export async function requireMobileSuperAdmin(
  request: Request,
): Promise<MobileAuth | NextResponse> {
  const auth = await requireMobileStaff(request);
  if (isMobileAuthError(auth)) return auth;
  if (!isSuperAdminRole(auth.profile.role)) {
    return NextResponse.json(
      { error: "Super Admin access required." },
      { status: 403 },
    );
  }
  return auth;
}
