import { NextResponse } from "next/server";

export function jsonOk(payload: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
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
