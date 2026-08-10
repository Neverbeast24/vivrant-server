import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

export type PriceQuoteEmailInput = {
  to: string;
  name: string;
  plan: string;
  pricePhp: number;
  inquiryId: number;
  note?: string | null;
};

export type InquiryAckEmailInput = {
  to: string;
  name: string;
  plan: string;
  inquiryId: number;
};

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Prefer static `process.env.FOO` (Next inlines it when present).
 * Also try concat access as a runtime fallback when the static slot is empty.
 */
function envValue(...parts: string[]) {
  const joined = parts.join("_");
  const staticMap: Record<string, string | undefined> = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE,
  };
  const staticValue = staticMap[joined];
  const concatValue = process.env[joined];
  return String(staticValue || concatValue || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function resendApiKey() {
  const raw = envValue("RESEND", "API", "KEY");
  if (!raw || raw.length < 8 || /^(your|changeme|todo|xxx)/i.test(raw)) return "";
  return raw;
}

function smtpConfig() {
  const host = envValue("SMTP", "HOST");
  const user = envValue("SMTP", "USER");
  // Gmail App Passwords are often copied with spaces — strip them.
  const pass = envValue("SMTP", "PASS").replace(/\s+/g, "");
  if (!host || !user || !pass) return null;
  const portRaw = Number(envValue("SMTP", "PORT") || "587");
  const port = Number.isFinite(portRaw) ? portRaw : 587;
  const secureFlag = envValue("SMTP", "SECURE").toLowerCase();
  const secure = secureFlag === "1" || secureFlag === "true" || port === 465;
  return { host, port, user, pass, secure };
}

function emailFrom(fallback: string) {
  return envValue("EMAIL", "FROM") || fallback;
}

function formatPhp(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function planLabel(plan: string) {
  if (plan === "plus") return "Plus";
  if (plan === "campus") return "Campus / Teams";
  return "VIVRΛNT";
}

function friendlySmtpError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("badcredentials") ||
    lower.includes("username and password not accepted") ||
    lower.includes("535") ||
    lower.includes("eauth")
  ) {
    return "Gmail rejected the login. Use a Google App Password (not your normal password) in SMTP_PASS, then restart/redeploy.";
  }
  if (lower.includes("self signed") || lower.includes("certificate")) {
    return "SMTP TLS failed. Keep SMTP_PORT=587 (STARTTLS) for Gmail.";
  }
  return message || "Could not send email via SMTP.";
}

export type EmailConfigStatus = {
  configured: boolean;
  /** smtp | resend | none */
  provider: "smtp" | "resend" | "none";
  /** local | preview | production | development */
  environment: string;
};

export function getEmailConfigStatus(): EmailConfigStatus {
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  const environment =
    vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development"
      ? vercelEnv
      : process.env.VERCEL === "1"
        ? "production"
        : "local";
  if (smtpConfig()) {
    return { configured: true, provider: "smtp", environment };
  }
  if (resendApiKey()) {
    return { configured: true, provider: "resend", environment };
  }
  return { configured: false, provider: "none", environment };
}

export function isEmailConfigured() {
  return getEmailConfigStatus().configured;
}

let cachedTransporter: Transporter | null = null;
let cachedTransporterKey = "";

function getSmtpTransporter(smtp: NonNullable<ReturnType<typeof smtpConfig>>) {
  const key = `${smtp.host}:${smtp.port}:${smtp.user}:${smtp.secure}`;
  if (cachedTransporter && cachedTransporterKey === key) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

async function sendViaSmtp(payload: MailPayload, smtp: NonNullable<ReturnType<typeof smtpConfig>>) {
  const from = emailFrom(`VIVRΛNT <${smtp.user}>`);
  const transporter = getSmtpTransporter(smtp);
  await transporter.sendMail({
    from,
    replyTo: smtp.user,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  return { ok: true as const, message: `Email sent to ${payload.to}.` };
}

async function sendViaResend(payload: MailPayload, apiKey: string) {
  const from = emailFrom("VIVRΛNT <onboarding@resend.dev>");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error("Resend inquiry email failed:", error);
    return {
      ok: false as const,
      message: error.message || "Could not send the email.",
    };
  }

  return { ok: true as const, message: `Email sent to ${payload.to}.` };
}

async function sendMail(payload: MailPayload) {
  const smtp = smtpConfig();
  const apiKey = resendApiKey();

  if (smtp) {
    try {
      return await sendViaSmtp(payload, smtp);
    } catch (error) {
      console.error("SMTP inquiry email failed:", error);
      if (apiKey) {
        console.warn("SMTP failed; falling back to Resend.");
        return sendViaResend(payload, apiKey);
      }
      return { ok: false as const, message: friendlySmtpError(error) };
    }
  }

  if (!apiKey) {
    return {
      ok: false as const,
      message:
        "Email is not configured. Add free Gmail SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) or RESEND_API_KEY, then restart/redeploy.",
    };
  }

  return sendViaResend(payload, apiKey);
}

export async function sendInquiryAckEmail(input: InquiryAckEmailInput) {
  const label = planLabel(input.plan);
  const result = await sendMail({
    to: input.to,
    subject: `We received your VIVRΛNT inquiry · #${input.inquiryId}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#14221b;max-width:560px">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for contacting VIVRΛNT about <strong>${escapeHtml(label)}</strong>.</p>
        <p>
          We received your message
          <strong>#${input.inquiryId}</strong>
          and our team will follow up by email soon.
        </p>
        <p style="color:#4a5c54">No extra action is needed from you right now. You can reply to this email anytime.</p>
        <p style="color:#4a5c54;font-size:12px">— VIVRΛNT · Long live life</p>
      </div>
    `,
    text: [
      `Hi ${input.name},`,
      "",
      `Thanks for contacting VIVRΛNT about ${label}.`,
      `We received your message #${input.inquiryId} and our team will follow up by email soon.`,
      "",
      "No extra action is needed from you right now. You can reply to this email anytime.",
      "",
      "— VIVRΛNT",
    ].join("\n"),
  });

  if (!result.ok) {
    return {
      ok: false as const,
      message: result.message || "Could not send the acknowledgment email.",
    };
  }
  return { ok: true as const, message: `Acknowledgment email sent to ${input.to}.` };
}

export async function sendInquiryPriceEmail(input: PriceQuoteEmailInput) {
  const priceLabel = formatPhp(input.pricePhp);
  const label = planLabel(input.plan);
  const result = await sendMail({
    to: input.to,
    subject: `VIVRΛNT ${label} quote · ${priceLabel}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#14221b;max-width:560px">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for your VIVRΛNT inquiry (#${input.inquiryId}).</p>
        <p>
          Here is the quoted price for <strong>${escapeHtml(label)}</strong>:
          <strong style="font-size:1.25rem">${priceLabel}</strong>
        </p>
        ${
          input.note
            ? `<p style="color:#4a5c54">${escapeHtml(input.note)}</p>`
            : ""
        }
        <p>Reply to this email if you have questions or are ready to proceed.</p>
        <p style="color:#4a5c54;font-size:12px">— VIVRΛNT · Long live life</p>
      </div>
    `,
    text: [
      `Hi ${input.name},`,
      "",
      `Thanks for your VIVRΛNT inquiry (#${input.inquiryId}).`,
      `Quoted price for ${label}: ${priceLabel}`,
      input.note ? `\n${input.note}\n` : "",
      "Reply to this email if you have questions or are ready to proceed.",
      "",
      "— VIVRΛNT",
    ].join("\n"),
  });

  if (!result.ok) {
    return {
      ok: false as const,
      message: result.message || "Could not send the price email.",
    };
  }
  return { ok: true as const, message: `Price email sent to ${input.to}.` };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
