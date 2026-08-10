import "server-only";

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

/**
 * Next.js only inlines env vars referenced with static property access
 * (`process.env.FOO`). Dynamic keys like `process.env[name]` stay empty
 * at runtime even when `.env.local` / Vercel has the value.
 */
function resendApiKey() {
  const raw = (process.env.RESEND_API_KEY ?? "").trim().replace(/^["']|["']$/g, "").trim();
  // Ignore empty / placeholder values that would still look "set" in some env files.
  if (!raw || raw.length < 8 || /^(your|changeme|todo|xxx)/i.test(raw)) return "";
  return raw;
}

function emailFrom() {
  return (process.env.EMAIL_FROM ?? "").trim().replace(/^["']|["']$/g, "").trim();
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

export function isEmailConfigured() {
  return Boolean(resendApiKey());
}

export async function sendInquiryAckEmail(input: InquiryAckEmailInput) {
  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      ok: false as const,
      message: "Email is not configured.",
    };
  }

  const from = emailFrom() || "VIVRΛNT <onboarding@resend.dev>";
  const label = planLabel(input.plan);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
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
        <p style="color:#4a5c54">No extra action is needed from you right now.</p>
        <p style="color:#4a5c54;font-size:12px">— VIVRΛNT · Long live life</p>
      </div>
    `,
    text: [
      `Hi ${input.name},`,
      "",
      `Thanks for contacting VIVRΛNT about ${label}.`,
      `We received your message #${input.inquiryId} and our team will follow up by email soon.`,
      "",
      "No extra action is needed from you right now.",
      "",
      "— VIVRΛNT",
    ].join("\n"),
  });

  if (error) {
    console.error("Resend inquiry ack email failed:", error);
    return {
      ok: false as const,
      message: error.message || "Could not send the acknowledgment email.",
    };
  }

  return { ok: true as const, message: `Acknowledgment email sent to ${input.to}.` };
}

export async function sendInquiryPriceEmail(input: PriceQuoteEmailInput) {
  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      ok: false as const,
      message:
        "Email is not configured. Add RESEND_API_KEY to .env.local (local) or Vercel env (production), then restart/redeploy.",
    };
  }

  const from = emailFrom() || "VIVRΛNT <onboarding@resend.dev>";
  const priceLabel = formatPhp(input.pricePhp);
  const label = planLabel(input.plan);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
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

  if (error) {
    console.error("Resend inquiry price email failed:", error);
    return {
      ok: false as const,
      message: error.message || "Could not send the price email.",
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
