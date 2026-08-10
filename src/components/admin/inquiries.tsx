"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateContactInquiry } from "@/app/admin/inquiries/actions";
import { PrimaryButton } from "@/components/dashboard/ui";
import { CONTACT_PLAN_LABEL, type ContactPlan } from "@/lib/contact";

export type AdminInquiry = {
  id: number;
  plan: string;
  name: string;
  email: string;
  organization: string | null;
  message: string;
  status: string;
  admin_note: string | null;
  quoted_price: number | null;
  price_emailed_at: string | null;
  user_id: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-ember/10 text-ember",
  in_progress: "bg-[#e8f0ff] text-[#3b6fd8]",
  resolved: "bg-accent-soft text-accent",
  closed: "bg-surface text-muted",
};

function defaultPrice(plan: string, existing: number | null) {
  if (existing != null) return String(existing);
  if (plan === "plus") return "299";
  return "";
}

function formatQuotedPrice(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function InquiryRow({
  inquiry,
  emailConfigured,
}: {
  inquiry: AdminInquiry;
  emailConfigured: boolean;
}) {
  const [pending, start] = useTransition();
  const alreadyQuoted = Boolean(inquiry.price_emailed_at);

  function onSubmit(formData: FormData) {
    start(async () => {
      const result = await updateContactInquiry(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const planLabel =
    CONTACT_PLAN_LABEL[inquiry.plan as ContactPlan] ?? inquiry.plan;

  return (
    <article className="border-b border-ink/5 px-5 py-5 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-ink">{inquiry.name}</p>
          <p className="mt-1 text-xs text-muted">
            #{inquiry.id} ·{" "}
            <a
              href={`mailto:${inquiry.email}`}
              className="underline decoration-ink/20 underline-offset-2 hover:text-accent hover:decoration-accent/40"
            >
              {inquiry.email}
            </a>
            {inquiry.organization ? ` · ${inquiry.organization}` : ""} ·{" "}
            {new Date(inquiry.created_at).toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold capitalize text-accent">{planLabel}</p>
          {inquiry.price_emailed_at && (
            <p className="mt-1 text-[11px] font-semibold text-accent">
              Quote emailed {new Date(inquiry.price_emailed_at).toLocaleString()}
              {inquiry.quoted_price != null
                ? ` · ${formatQuotedPrice(inquiry.quoted_price)}`
                : ""}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
            STATUS_STYLE[inquiry.status] ?? STATUS_STYLE.open
          }`}
        >
          {inquiry.status.replaceAll("_", " ")}
        </span>
      </div>

      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-ink/80">
        {inquiry.message}
      </p>

      <form action={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_8rem_auto]">
        <input type="hidden" name="id" value={inquiry.id} />
        <label className="block text-xs font-bold text-muted">
          Status
          <select
            name="status"
            defaultValue={inquiry.status}
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-panel px-3 py-2.5 text-sm font-semibold text-ink"
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-muted">
          Note to include in quote email
          <input
            name="admin_note"
            maxLength={1000}
            defaultValue={inquiry.admin_note ?? ""}
            placeholder="Optional message for the requester"
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-panel px-3 py-2.5 text-sm font-semibold text-ink"
          />
        </label>
        <label className="block text-xs font-bold text-muted">
          Quote price (₱)
          <input
            name="quoted_price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultPrice(inquiry.plan, inquiry.quoted_price)}
            placeholder={inquiry.plan === "plus" ? "299" : "Custom"}
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-panel px-3 py-2.5 text-sm font-semibold text-ink"
          />
        </label>
        <div className="flex flex-col justify-end gap-2">
          <label
            className={`flex items-center gap-2 text-xs font-bold ${
              emailConfigured ? "text-ink" : "text-muted"
            }`}
            title={
              emailConfigured
                ? alreadyQuoted
                  ? "Send an updated quote email again"
                  : "Sends the quote price to this person’s email when you update"
                : "Email sending is unavailable until SMTP or RESEND_API_KEY is configured"
            }
          >
            <input
              type="checkbox"
              name="send_price_email"
              defaultChecked={emailConfigured && !alreadyQuoted}
              disabled={!emailConfigured}
              className="size-4 rounded border-ink/20 accent-[var(--accent)] disabled:opacity-50"
            />
            {alreadyQuoted ? "Resend quote email" : "Email quote now"}
          </label>
          <PrimaryButton type="submit" disabled={pending} className="w-full rounded-full px-5">
            {pending
              ? "Saving…"
              : emailConfigured
                ? "Save / send quote"
                : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </article>
  );
}

export function AdminInquiriesView({
  inquiries,
  emailConfigured = false,
  emailEnvironment = "local",
  emailProvider = "none",
  smtpMissing = [],
  resendTestingMode = false,
}: {
  inquiries: AdminInquiry[];
  emailConfigured?: boolean;
  emailEnvironment?: string;
  emailProvider?: "smtp" | "resend" | "none";
  smtpMissing?: string[];
  resendTestingMode?: boolean;
}) {
  const openCount = inquiries.filter(
    (row) => row.status === "open" || row.status === "in_progress",
  ).length;
  const onVercel = emailEnvironment === "production" || emailEnvironment === "preview";
  const providerLabel =
    emailProvider === "smtp" ? "Gmail/SMTP" : emailProvider === "resend" ? "Resend" : "none";

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-accent">SUPER ADMIN</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Contact inquiries</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Requesters get an automatic confirmation email. Here you set a price and email the quote.{" "}
        <span className="font-bold text-accent">{openCount} active</span> right now.
      </p>

      {emailConfigured && emailProvider === "smtp" ? (
        <p className="mt-4 max-w-2xl rounded-2xl border border-accent/20 bg-accent-soft/60 px-4 py-3 text-sm leading-6 text-ink">
          <span className="font-bold text-accent">Email ready</span> ({providerLabel}). New
          inquiries auto-reply immediately. Enter a ₱ price, keep{" "}
          <span className="font-bold">Email quote now</span> checked, then{" "}
          <span className="font-bold">Save / send quote</span>.
        </p>
      ) : emailConfigured && emailProvider === "resend" ? (
        <p className="mt-4 max-w-2xl rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-6 text-ink">
          <span className="font-bold">Resend testing mode</span>
          {resendTestingMode ? " is active" : ""}. It can only email your Resend account address
          until you verify a domain. For customer quotes, set free Gmail SMTP (
          <span className="font-bold">SMTP_HOST</span>, <span className="font-bold">SMTP_USER</span>,{" "}
          <span className="font-bold">SMTP_PASS</span>)
          {onVercel ? " on Vercel Production (Non-sensitive preferred), then redeploy." : " in .env.local and restart."}
        </p>
      ) : (
        <p className="mt-4 max-w-2xl rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-6 text-ink">
          <span className="font-bold">Email is off</span> on this server ({emailEnvironment}).
          {smtpMissing.length > 0 ? (
            <>
              {" "}
              SMTP is incomplete — missing{" "}
              <span className="font-bold">{smtpMissing.join(", ")}</span>.
            </>
          ) : (
            <>
              {" "}
              Set free Gmail SMTP (<span className="font-bold">SMTP_HOST</span>,{" "}
              <span className="font-bold">SMTP_USER</span>,{" "}
              <span className="font-bold">SMTP_PASS</span> App Password)
            </>
          )}
          {onVercel
            ? " in Vercel → Environment Variables (Production; prefer Non-sensitive for host/user/port), then redeploy."
            : " in .env.local and restart npm run dev."}{" "}
          You can still update status and prices without sending mail.
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-ink/8 bg-card/85 shadow-sm">
        {inquiries.map((inquiry) => (
          <InquiryRow
            key={`${inquiry.id}-${inquiry.status}-${inquiry.admin_note ?? ""}-${inquiry.quoted_price ?? ""}-${inquiry.price_emailed_at ?? ""}`}
            inquiry={inquiry}
            emailConfigured={emailConfigured && emailProvider === "smtp"}
          />
        ))}
        {!inquiries.length && (
          <p className="px-5 py-10 text-center text-sm text-muted">No inquiries yet.</p>
        )}
      </div>
    </>
  );
}
