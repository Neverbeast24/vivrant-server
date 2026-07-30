import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function redactEmail(value: string) {
  const at = value.indexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const maskedLocal =
    local.length <= 2 ? "**" : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.includes("@") && value.includes(".")) {
      return redactEmail(value);
    }
    if (/^eyJ[A-Za-z0-9_-]+\./.test(value) || value.length > 120) {
      return "[redacted]";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    const out: LogFields = {};
    for (const [key, nested] of Object.entries(value as LogFields)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("password") ||
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("authorization")
      ) {
        out[key] = "[redacted]";
      } else if (lower.includes("email")) {
        out[key] =
          typeof nested === "string" ? redactEmail(nested) : "[redacted]";
      } else {
        out[key] = sanitize(nested);
      }
    }
    return out;
  }
  return value;
}

function write(level: LogLevel, scope: string, message: string, fields?: LogFields) {
  const payload = {
    level,
    scope,
    message,
    ts: new Date().toISOString(),
    ...(fields ? (sanitize(fields) as LogFields) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  debug(scope: string, message: string, fields?: LogFields) {
    if (process.env.NODE_ENV === "production") return;
    write("debug", scope, message, fields);
  },
  info(scope: string, message: string, fields?: LogFields) {
    write("info", scope, message, fields);
  },
  warn(scope: string, message: string, fields?: LogFields) {
    write("warn", scope, message, fields);
  },
  error(scope: string, message: string, fields?: LogFields) {
    write("error", scope, message, fields);
  },
  redactEmail,
};
