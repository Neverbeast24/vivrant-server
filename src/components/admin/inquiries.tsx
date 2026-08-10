"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Mail,
  MailWarning,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  setContactInquiryStatus,
  updateContactInquiry,
} from "@/app/admin/inquiries/actions";
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

type FilterTab = "active" | "quoted" | "closed" | "all";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-ember/15 text-ember",
  in_progress: "bg-[#3b6fd8]/15 text-[#8eb0ff]",
  resolved: "bg-accent/15 text-accent",
  closed: "bg-white/8 text-muted",
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

function isActiveStatus(status: string) {
  return status === "open" || status === "in_progress";
}

function InquiryRow({
  inquiry,
  emailConfigured,
}: {
  inquiry: AdminInquiry;
  emailConfigured: boolean;
}) {
  const [pending, start] = useTransition();
  const [expanded, setExpanded] = useState(isActiveStatus(inquiry.status));
  const alreadyQuoted = Boolean(inquiry.price_emailed_at);
  const isClosed = inquiry.status === "closed" || inquiry.status === "resolved";
  const planLabel =
    CONTACT_PLAN_LABEL[inquiry.plan as ContactPlan] ?? inquiry.plan;

  function runUpdate(formData: FormData) {
    start(async () => {
      const result = await updateContactInquiry(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function runStatus(status: "open" | "closed" | "in_progress") {
    const formData = new FormData();
    formData.set("id", String(inquiry.id));
    formData.set("status", status);
    start(async () => {
      const result = await setContactInquiryStatus(formData);
      if (result.ok) {
        toast.success(result.message);
        if (status === "open") setExpanded(true);
      } else toast.error(result.message);
    });
  }

  return (
    <article className="border-b border-ink/6 px-5 py-5 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-ink">{inquiry.name}</p>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">
              {planLabel}
            </span>
            {alreadyQuoted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">
                <CheckCircle2 size={11} />
                Quoted
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            #{inquiry.id}
            {" · "}
            <a
              href={`mailto:${inquiry.email}`}
              className="underline decoration-ink/15 underline-offset-2 hover:text-accent hover:decoration-accent/40"
            >
              {inquiry.email}
            </a>
            {inquiry.organization ? ` · ${inquiry.organization}` : ""}
            {" · "}
            {new Date(inquiry.created_at).toLocaleString()}
          </p>
          {inquiry.price_emailed_at && (
            <p className="mt-1 text-[11px] font-semibold text-accent">
              Quote emailed {new Date(inquiry.price_emailed_at).toLocaleString()}
              {inquiry.quoted_price != null
                ? ` · ${formatQuotedPrice(inquiry.quoted_price)}`
                : ""}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              STATUS_STYLE[inquiry.status] ?? STATUS_STYLE.open
            }`}
          >
            {inquiry.status.replaceAll("_", " ")}
          </span>
          {isClosed ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => runStatus("open")}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-panel px-3 py-1.5 text-[11px] font-bold text-ink transition hover:border-accent/30 hover:text-accent disabled:opacity-50"
            >
              <RotateCcw size={12} />
              Reopen
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => runStatus("closed")}
              className="rounded-full border border-ink/10 bg-panel px-3 py-1.5 text-[11px] font-bold text-muted transition hover:text-ink disabled:opacity-50"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-ink/10 bg-panel px-3 py-1.5 text-[11px] font-bold text-muted transition hover:text-ink"
          >
            {expanded ? "Hide" : "Manage"}
          </button>
        </div>
      </div>

      <p className="mt-3 max-w-3xl whitespace-pre-wrap rounded-2xl border border-ink/6 bg-panel/50 px-4 py-3 text-sm leading-6 text-ink/85">
        {inquiry.message || "No message provided."}
      </p>

      {expanded && (
        <form
          action={runUpdate}
          className="mt-4 grid gap-3 rounded-2xl border border-ink/8 bg-panel/40 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_7.5rem_auto]"
        >
          <input type="hidden" name="id" value={inquiry.id} />
          <label className="block text-xs font-bold text-muted">
            Status
            <select
              name="status"
              defaultValue={inquiry.status}
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-card px-3 py-2.5 text-sm font-semibold text-ink"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Note in quote email
            <input
              name="admin_note"
              maxLength={1000}
              defaultValue={inquiry.admin_note ?? ""}
              placeholder="Optional note for the requester"
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-card px-3 py-2.5 text-sm font-semibold text-ink"
            />
          </label>
          <label className="block text-xs font-bold text-muted">
            Quote (₱)
            <input
              name="quoted_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaultPrice(inquiry.plan, inquiry.quoted_price)}
              placeholder={inquiry.plan === "plus" ? "299" : "Custom"}
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-card px-3 py-2.5 text-sm font-semibold text-ink"
            />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <label
              className={`flex items-center gap-2 text-xs font-bold ${
                emailConfigured ? "text-ink" : "text-muted"
              }`}
            >
              <input
                type="checkbox"
                name="send_price_email"
                defaultChecked={emailConfigured && !alreadyQuoted && !isClosed}
                disabled={!emailConfigured}
                className="size-4 rounded border-ink/20 accent-[var(--accent)] disabled:opacity-50"
              />
              {alreadyQuoted ? "Resend quote" : "Email quote"}
            </label>
            <PrimaryButton
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5"
            >
              <Send size={13} />
              {pending
                ? "Saving…"
                : emailConfigured
                  ? alreadyQuoted
                    ? "Save / resend"
                    : "Save / send quote"
                  : "Save"}
            </PrimaryButton>
            {emailConfigured && (
              <p className="text-[10px] leading-4 text-muted">
                Sending a quote closes this inquiry automatically.
              </p>
            )}
          </div>
        </form>
      )}
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
  const [tab, setTab] = useState<FilterTab>("active");
  const smtpReady = emailConfigured && emailProvider === "smtp";

  const counts = useMemo(() => {
    const active = inquiries.filter((row) => isActiveStatus(row.status)).length;
    const quoted = inquiries.filter((row) => row.price_emailed_at).length;
    const closed = inquiries.filter(
      (row) => row.status === "closed" || row.status === "resolved",
    ).length;
    return { active, quoted, closed, all: inquiries.length };
  }, [inquiries]);

  const filtered = useMemo(() => {
    if (tab === "active") return inquiries.filter((row) => isActiveStatus(row.status));
    if (tab === "quoted") return inquiries.filter((row) => row.price_emailed_at);
    if (tab === "closed") {
      return inquiries.filter(
        (row) => row.status === "closed" || row.status === "resolved",
      );
    }
    return inquiries;
  }, [inquiries, tab]);

  const onVercel =
    emailEnvironment === "production" || emailEnvironment === "preview";

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "active", label: "Active", count: counts.active },
    { id: "quoted", label: "Quoted", count: counts.quoted },
    { id: "closed", label: "Closed", count: counts.closed },
    { id: "all", label: "All", count: counts.all },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-accent">
            SUPER ADMIN
          </p>
          <h1 className="font-display mt-2 text-4xl tracking-tight">
            Contact inquiries
          </h1>
          <p className="mt-2 text-sm text-muted">
            Quote pricing and follow up with requesters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {smtpReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent">
              <Mail size={12} />
              Gmail/SMTP configured
            </span>
          ) : emailProvider === "resend" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/30 bg-ember/10 px-3 py-1.5 text-[11px] font-bold text-ember">
              <MailWarning size={12} />
              Resend testing only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/30 bg-ember/10 px-3 py-1.5 text-[11px] font-bold text-ember">
              <MailWarning size={12} />
              Email off
            </span>
          )}
        </div>
      </div>

      {!smtpReady && (
        <p className="mt-4 max-w-2xl rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-6 text-ink">
          {emailProvider === "resend" ? (
            <>
              <span className="font-bold">Resend testing mode</span>
              {resendTestingMode ? " is active" : ""}. Customer quotes need Gmail
              SMTP
              {onVercel
                ? " on Vercel Production, then redeploy."
                : " in .env.local, then restart."}
            </>
          ) : (
            <>
              <span className="font-bold">Email is off</span> ({emailEnvironment}).
              {smtpMissing.length > 0 ? (
                <>
                  {" "}
                  Missing <span className="font-bold">{smtpMissing.join(", ")}</span>.
                </>
              ) : (
                <> Set SMTP_HOST, SMTP_USER, and SMTP_PASS.</>
              )}
            </>
          )}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-accent text-solid-fg"
                  : "border border-ink/10 bg-panel text-muted hover:text-ink"
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${active ? "opacity-80" : "text-accent"}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-ink/8 bg-card/85 shadow-sm">
        {filtered.map((inquiry) => (
          <InquiryRow
            key={`${inquiry.id}-${inquiry.status}-${inquiry.admin_note ?? ""}-${inquiry.quoted_price ?? ""}-${inquiry.price_emailed_at ?? ""}`}
            inquiry={inquiry}
            emailConfigured={smtpReady}
          />
        ))}
        {!filtered.length && (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {tab === "active"
              ? "No active inquiries."
              : tab === "quoted"
                ? "No quoted inquiries yet."
                : tab === "closed"
                  ? "No closed inquiries."
                  : "No inquiries yet."}
          </p>
        )}
      </div>
    </>
  );
}
