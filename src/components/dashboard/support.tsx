"use client";

import { useRef } from "react";
import Link from "next/link";
import { Bug, LifeBuoy, MessageSquarePlus } from "lucide-react";
import { submitSupportTicket } from "@/app/dashboard/support/actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

export type SupportTicket = {
  id: number;
  category: string;
  priority: string;
  subject: string;
  description: string;
  page_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-ember/10 text-ember",
  in_progress: "bg-[#e8f0ff] text-[#3b6fd8]",
  resolved: "bg-accent-soft text-accent",
  closed: "bg-surface text-muted",
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function SupportView({ tickets }: { tickets: SupportTicket[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, submit } = useModuleAction(async (formData) => {
    const result = await submitSupportTicket(formData);
    if (result.ok) formRef.current?.reset();
    return result;
  });

  return (
    <>
      <PageHeader
        eyebrow="HELP"
        title="Questions,"
        highlight="bugs, and feedback."
      />

      <Panel title="New here?" className="mb-4" right={<LifeBuoy size={16} className="text-accent" />}>
        <p className="mb-3 text-sm text-muted">
          Start with these — you do not need a ticket for ordinary setup questions.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard", label: "Today checklist" },
            { href: "/dashboard/settings", label: "Health profile" },
            { href: "/dashboard/nutrition/log", label: "Log a meal" },
            { href: "/dashboard/ai", label: "Ask VIVRΛNT" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-ink/10 bg-surface/70 px-3 py-1.5 text-[11px] font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel
        title="Submit a ticket"
        className="mb-4"
        right={<MessageSquarePlus size={16} className="text-accent" />}
      >
        <form ref={formRef} action={submit} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Category">
            <select name="category" defaultValue="bug" className={fieldClass}>
              <option value="bug">Bug</option>
              <option value="feature">Feature request</option>
              <option value="account">Account / access</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select name="priority" defaultValue="normal" className={fieldClass}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Subject" hint="Short summary" className="sm:col-span-2">
            <input
              name="subject"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Estimate macros fails on Log meal"
              className={fieldClass}
            />
          </FormField>
          <FormField
            label="What happened?"
            hint="Steps, expected vs actual"
            className="sm:col-span-2"
          >
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Describe the issue, what you tried, and anything that helps us reproduce it."
              className={fieldClass}
            />
          </FormField>
          <FormField label="Page URL" hint="Optional" className="sm:col-span-2">
            <input
              name="page_url"
              maxLength={500}
              placeholder="/dashboard/nutrition/log"
              className={fieldClass}
            />
          </FormField>
          <PrimaryButton type="submit" disabled={pending} className="sm:col-span-2">
            <Bug size={14} className="shrink-0" />
            {pending ? "Sending…" : "Submit ticket"}
          </PrimaryButton>
        </form>
      </Panel>

      <Panel
        title="Your tickets"
        right={<LifeBuoy size={16} className="text-accent" />}
      >
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-ink/6 bg-surface/45 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{ticket.subject}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted">
                    #{ticket.id} · {ticket.category} · {ticket.priority} priority ·{" "}
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                    STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open
                  }`}
                >
                  {statusLabel(ticket.status)}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{ticket.description}</p>
              {ticket.admin_note && (
                <p className="mt-3 rounded-xl bg-accent-soft/70 px-3 py-2 text-xs leading-5 text-accent">
                  <span className="font-black">Staff note:</span> {ticket.admin_note}
                </p>
              )}
            </div>
          ))}
          {!tickets.length && (
            <EmptyState>No tickets yet. Submit one above if something looks off.</EmptyState>
          )}
        </div>
      </Panel>
    </>
  );
}
