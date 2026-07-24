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

function formatPhp(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export async function sendInquiryPriceEmail(input: PriceQuoteEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      message:
        "Email is not configured. Add RESEND_API_KEY (and optional EMAIL_FROM) in Vercel env, then redeploy.",
    };
  }

  const from =
    process.env.EMAIL_FROM?.trim() || "VIVRΛNT <onboarding@resend.dev>";
  const priceLabel = formatPhp(input.pricePhp);
  const planLabel =
    input.plan === "plus"
      ? "Plus"
      : input.plan === "campus"
        ? "Campus"
        : "VIVRΛNT";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `VIVRΛNT ${planLabel} quote · ${priceLabel}`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#14221b;max-width:560px">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for your VIVRΛNT inquiry (#${input.inquiryId}).</p>
        <p>
          Here is the quoted price for <strong>${escapeHtml(planLabel)}</strong>:
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
      `Quoted price for ${planLabel}: ${priceLabel}`,
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
