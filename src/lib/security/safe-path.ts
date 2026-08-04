/**
 * Allow only same-origin relative app paths.
 * Rejects protocol-relative (`//evil`), schemes (`https:`), and odd characters.
 */
export function safeAppPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes(":")) {
    return fallback;
  }
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}
