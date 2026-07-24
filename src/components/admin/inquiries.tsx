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

function InquiryRow({ inquiry }: { inquiry: AdminInquiry }) {
  const [pending, start] = useTransition();

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
            #{inquiry.id} · {inquiry.email}
            {inquiry.organization ? ` · ${inquiry.organization}` : ""} ·{" "}
            {new Date(inquiry.created_at).toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold capitalize text-accent">{planLabel}</p>
          {inquiry.price_emailed_at && (
            <p className="mt-1 text-[11px] font-semibold text-accent">
              Price emailed {new Date(inquiry.price_emailed_at).toLocaleString()}
              {inquiry.quoted_price != null ? ` · ₱${inquiry.quoted_price}` : ""}
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
          Staff note
          <input
            name="admin_note"
            maxLength={1000}
            defaultValue={inquiry.admin_note ?? ""}
            placeholder="Optional note included in the email"
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-panel px-3 py-2.5 text-sm font-semibold text-ink"
          />
        </label>
        <label className="block text-xs font-bold text-muted">
          Price (₱)
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
          <label className="flex items-center gap-2 text-xs font-bold text-ink">
            <input
              type="checkbox"
              name="send_price_email"
              defaultChecked
              className="size-4 rounded border-ink/20 accent-[var(--accent)]"
            />
            Email price
          </label>
          <PrimaryButton type="submit" disabled={pending} className="w-full rounded-full px-5">
            {pending ? "Sending…" : "Update"}
          </PrimaryButton>
        </div>
      </form>
    </article>
  );
}

export function AdminInquiriesView({ inquiries }: { inquiries: AdminInquiry[] }) {
  const openCount = inquiries.filter(
    (row) => row.status === "open" || row.status === "in_progress",
  ).length;

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-accent">SUPER ADMIN</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Contact inquiries</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Enter a price and keep <span className="font-bold text-ink">Email price</span> checked to
        automatically email the quote to the requester.{" "}
        <span className="font-bold text-accent">{openCount} active</span> right now.
      </p>

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-ink/8 bg-card/85 shadow-sm">
        {inquiries.map((inquiry) => (
          <InquiryRow
            key={`${inquiry.id}-${inquiry.status}-${inquiry.admin_note ?? ""}-${inquiry.quoted_price ?? ""}-${inquiry.price_emailed_at ?? ""}`}
            inquiry={inquiry}
          />
        ))}
        {!inquiries.length && (
          <p className="px-5 py-10 text-center text-sm text-muted">No inquiries yet.</p>
        )}
      </div>
    </>
  );
}
