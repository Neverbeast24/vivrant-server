import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function newRequestId() {
  return crypto.randomUUID();
}

const INTERNAL_ERROR_HINT =
  /postgres|supabase|pgrst|permission denied|violates|duplicate key|foreign key|relation |column |\brls\b|row-level|jwt|invalid api key|fetch failed|econnrefused|enotfound/i;

function looksInternal(message: string, status: number) {
  return status >= 500 || INTERNAL_ERROR_HINT.test(message);
}

export function jsonOk(payload: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

/**
 * Stable API error shape. `error` stays a string for mobile clients;
 * `code` + `request_id` are additive metadata.
 * Raw DB/provider messages are logged and replaced with a safe client string.
 */
export function jsonError(
  error: string,
  status = 400,
  options?: { code?: string; requestId?: string; scope?: string },
) {
  const requestId = options?.requestId ?? newRequestId();
  let message = error;
  let code = options?.code ?? "request_failed";

  if (looksInternal(error, status)) {
    logger.error(options?.scope ?? "api", "Internal API error", {
      request_id: requestId,
      status,
      internal: error,
    });
    message =
      status >= 500
        ? "Something went wrong. Please try again."
        : "Could not complete that request.";
    code = options?.code ?? (status >= 500 ? "server_error" : "request_failed");
  }

  return NextResponse.json(
    {
      ok: false,
      error: message,
      code,
      request_id: requestId,
    },
    { status },
  );
}

/** Explicit helper when you already know the failure is a DB/provider error. */
export function jsonDbError(
  err: { message?: string } | string | null | undefined,
  status = 500,
  fallback = "Something went wrong. Please try again.",
  options?: { code?: string; requestId?: string; scope?: string },
) {
  const internal = typeof err === "string" ? err : err?.message;
  return jsonError(internal || fallback, status, {
    code: options?.code ?? "database_error",
    requestId: options?.requestId,
    scope: options?.scope ?? "api/db",
  });
}

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function dayStartIso(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

export function parseIdParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}
