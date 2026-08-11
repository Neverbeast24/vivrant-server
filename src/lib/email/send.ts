import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import {
  BRAND_CONTACT_EMAIL,
  BRAND_FROM,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand";

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
 * Runtime-only env read.
 * Vercel "Sensitive" vars are NOT available at build time. Direct
 * `process.env.SMTP_PASS` gets inlined as empty during `next build`, which made
 * production fall back to Resend. Computed access keeps the lookup live.
 */
function envValue(name: string) {
  const env = process.env;
  const raw = env[name];
  return String(raw ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function resendApiKey() {
  const raw = envValue("RESEND_API_KEY");
  if (!raw || raw.length < 8 || /^(your|changeme|todo|xxx)/i.test(raw)) return "";
  return raw;
}

function smtpConfig() {
  const host = envValue("SMTP_HOST");
  const user = envValue("SMTP_USER");
  // Gmail App Passwords are often copied with spaces — strip them.
  const pass = envValue("SMTP_PASS").replace(/\s+/g, "");
  if (!host || !user || !pass) return null;
  const portRaw = Number(envValue("SMTP_PORT") || "587");
  const port = Number.isFinite(portRaw) ? portRaw : 587;
  const secureFlag = envValue("SMTP_SECURE").toLowerCase();
  const secure = secureFlag === "1" || secureFlag === "true" || port === 465;
  return { host, port, user, pass, secure };
}

/** True when any SMTP_* key is present (even if incomplete). */
function smtpEnvAttempted() {
  return Boolean(
    envValue("SMTP_HOST") || envValue("SMTP_USER") || envValue("SMTP_PASS"),
  );
}

function smtpMissingFields() {
  const missing: string[] = [];
  if (!envValue("SMTP_HOST")) missing.push("SMTP_HOST");
  if (!envValue("SMTP_USER")) missing.push("SMTP_USER");
  if (!envValue("SMTP_PASS")) missing.push("SMTP_PASS");
  return missing;
}

function emailFrom(fallback: string) {
  return envValue("EMAIL_FROM") || fallback;
}

function brandReplyTo() {
  return BRAND_CONTACT_EMAIL;
}

function appBaseUrl() {
  const raw =
    envValue("NEXT_PUBLIC_APP_URL") ||
    envValue("APP_URL") ||
    "https://vivrant-server.vercel.app";
  return raw.replace(/\/$/, "");
}

function brandLogoUrl() {
  return `${appBaseUrl()}/vivrant-mark.png`;
}

function emailFooterHtml() {
  const logo = brandLogoUrl();
  return `
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e4ebe7;text-align:center">
      <img src="${escapeHtml(logo)}" alt="${BRAND_NAME}" width="72" height="72" style="display:block;margin:0 auto;width:72px;height:72px;border:0;border-radius:14px;background:#000" />
      <p style="margin:12px 0 0;font-size:12px;color:#4a5c54">
        <a href="mailto:${BRAND_CONTACT_EMAIL}" style="color:#0E7C66;text-decoration:none;font-weight:600">${BRAND_CONTACT_EMAIL}</a>
      </p>
    </div>
  `;
}

function emailFooterText() {
  return ["", BRAND_CONTACT_EMAIL].join("\n");
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
    return "Gmail rejected the login. Create a new App Password at https://myaccount.google.com/apppasswords (2-Step Verification on), put it in SMTP_PASS for the same SMTP_USER mailbox, then redeploy.";
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
  /** Present when SMTP was intended but a required var is missing/empty at runtime. */
  smtpMissing?: string[];
  /** Resend free tier can only mail the account owner until a domain is verified. */
  resendTestingMode?: boolean;
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
  // If SMTP vars were set (e.g. Sensitive on Vercel but empty at build/runtime),
  // do not silently advertise Resend — surface the misconfig instead.
  if (smtpEnvAttempted()) {
    return {
      configured: false,
      provider: "none",
      environment,
      smtpMissing: smtpMissingFields(),
    };
  }
  if (resendApiKey()) {
    return {
      configured: true,
      provider: "resend",
      environment,
      resendTestingMode: true,
    };
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
    requireTLS: !smtp.secure && smtp.port === 587,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

async function sendViaSmtp(payload: MailPayload, smtp: NonNullable<ReturnType<typeof smtpConfig>>) {
  // Gmail authenticates as SMTP_USER. From can only be that address (or an
  // authorized Send-as alias). Prefer EMAIL_FROM when it matches SMTP_USER;
  // otherwise send as the authenticated mailbox so login does not fail.
  const configuredFrom = emailFrom(BRAND_FROM);
  const authFrom = `VIVRΛNT <${smtp.user}>`;
  const from =
    configuredFrom.toLowerCase().includes(smtp.user.toLowerCase())
      ? configuredFrom
      : authFrom;
  const transporter = getSmtpTransporter(smtp);
  await transporter.sendMail({
    from,
    replyTo: brandReplyTo(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  return { ok: true as const, message: `Email sent to ${payload.to}.` };
}

async function sendViaResend(payload: MailPayload, apiKey: string) {
  const from = emailFrom(BRAND_FROM);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    replyTo: brandReplyTo(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error("Resend inquiry email failed:", error);
    const raw = error.message || "Could not send the email.";
    const testingOnly =
      /only send testing emails to your own email address/i.test(raw) ||
      /verify a domain at resend\.com\/domains/i.test(raw);
    return {
      ok: false as const,
      message: testingOnly
        ? `${raw} Fix: use Gmail SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS App Password) on Vercel Production so quotes can go to any customer email.`
        : raw,
    };
  }

  return { ok: true as const, message: `Email sent to ${payload.to}.` };
}

async function sendMail(payload: MailPayload) {
  const smtp = smtpConfig();
  // Prefer SMTP only — do not silently fall back to Resend (testing mode
  // rejects other recipients and hides real SMTP misconfig).
  if (smtp) {
    try {
      return await sendViaSmtp(payload, smtp);
    } catch (error) {
      console.error("SMTP inquiry email failed:", error);
      return { ok: false as const, message: friendlySmtpError(error) };
    }
  }

  if (smtpEnvAttempted()) {
    const missing = smtpMissingFields();
    return {
      ok: false as const,
      message: missing.length
        ? `Gmail SMTP is incomplete (missing ${missing.join(", ")}). On Vercel, set them for Production (prefer Non-sensitive for SMTP_HOST/SMTP_USER/SMTP_PORT), then redeploy. Do not rely on Resend testing mode for customer quotes.`
        : "Gmail SMTP env vars are present but could not be read at runtime. Mark SMTP_HOST/SMTP_USER/SMTP_PORT as Non-sensitive on Vercel (SMTP_PASS may stay Sensitive), then redeploy.",
    };
  }

  const apiKey = resendApiKey();
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
    subject: `We received your ${BRAND_NAME} inquiry · #${input.inquiryId}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#14221b;max-width:560px">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for contacting ${BRAND_NAME} about <strong>${escapeHtml(label)}</strong>.</p>
        <p>
          We received your message
          <strong>#${input.inquiryId}</strong>
          and our team will follow up by email soon.
        </p>
        <p style="color:#4a5c54">No extra action is needed from you right now. You can reply to this email anytime.</p>
        ${emailFooterHtml()}
      </div>
    `,
    text: [
      `Hi ${input.name},`,
      "",
      `Thanks for contacting ${BRAND_NAME} about ${label}.`,
      `We received your message #${input.inquiryId} and our team will follow up by email soon.`,
      "",
      "No extra action is needed from you right now. You can reply to this email anytime.",
      emailFooterText(),
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
    subject: `${BRAND_NAME} ${label} quote · ${priceLabel}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#14221b;max-width:560px">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for your ${BRAND_NAME} inquiry (#${input.inquiryId}).</p>
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
        ${emailFooterHtml()}
      </div>
    `,
    text: [
      `Hi ${input.name},`,
      "",
      `Thanks for your ${BRAND_NAME} inquiry (#${input.inquiryId}).`,
      `Quoted price for ${label}: ${priceLabel}`,
      input.note ? `\n${input.note}\n` : "",
      "Reply to this email if you have questions or are ready to proceed.",
      emailFooterText(),
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
