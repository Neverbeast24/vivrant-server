import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClientForResponse } from "@/lib/supabase/server";
import { safeAppPath } from "@/lib/security/safe-path";

function loginRedirect(request: NextRequest, message: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/login";
  destination.search = `?error=${encodeURIComponent(message)}`;
  return NextResponse.redirect(destination);
}

function successRedirect(request: NextRequest, next: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = safeAppPath(next, "/dashboard");
  destination.search = "";
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = params.get("next") ?? "/dashboard";
  const destinationPath = type === "recovery" ? "/reset-password" : next;

  // The provider can bounce back with an explicit error (e.g. user cancelled).
  const providerError = params.get("error_description") ?? params.get("error");
  if (providerError) {
    return loginRedirect(request, providerError);
  }

  // OAuth and PKCE email links arrive with ?code=...
  if (code) {
    const response = successRedirect(request, destinationPath);
    const supabase = await createClientForResponse(response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginRedirect(request, "We could not complete sign in. Please try again.");
    }
    return response;
  }

  // Older email templates arrive with ?token_hash=...&type=recovery|email|signup
  if (tokenHash && type) {
    const response = successRedirect(request, destinationPath);
    const supabase = await createClientForResponse(response);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return loginRedirect(request, "That link has expired. Please request a new one.");
    }
    return response;
  }

  return loginRedirect(request, "The sign-in link is missing its code.");
}
