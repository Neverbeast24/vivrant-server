"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Send } from "lucide-react";
import { toast } from "sonner";
import { submitContactInquiry } from "@/app/contact/actions";
import type { ContactPlan } from "@/lib/contact";

const topics: { value: ContactPlan; label: string }[] = [
  { value: "general", label: "General inquiry" },
  { value: "plus", label: "Plus (₱299/mo)" },
  { value: "campus", label: "Campus / teams" },
];

export function InquiryForm({ defaultPlan = "general" }: { defaultPlan?: ContactPlan }) {
  const [plan, setPlan] = useState<ContactPlan>(defaultPlan);
  const [pending, start] = useTransition();

  return (
    <form
      action={(formData) => {
        formData.set("plan", plan);
        start(async () => {
          try {
            const result = await submitContactInquiry(formData);
            if (result && !result.ok) toast.error(result.message);
          } catch {
            // redirect() throws; Next.js handles navigation
          }
        });
      }}
      className="rounded-[1.8rem] border border-ink/8 bg-card/95 p-6 shadow-[0_14px_32px_rgba(var(--shadow-color),.08)] sm:p-8"
    >
      <p className="text-[11px] font-black tracking-[0.18em] text-accent">SEND AN INQUIRY</p>
      <h2 className="font-display mt-2 text-2xl text-ink">Tell us what you need</h2>
      <p className="mt-2 text-sm leading-6 text-ink/75">
        Send a Plus, Campus, or general request. Our team reviews inquiries in the admin inbox and
        follows up by email.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {topics.map((topic) => (
          <button
            key={topic.value}
            type="button"
            onClick={() => setPlan(topic.value)}
            className={`rounded-xl border px-3 py-2.5 text-left text-xs font-black transition ${
              plan === topic.value
                ? "border-accent bg-accent-soft text-ink"
                : "border-ink/10 bg-surface/70 text-ink/70 hover:border-accent/30"
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">
            Your name
          </span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Full name"
            className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">
            Your email
          </span>
          <input
            type="email"
            name="email"
            required
            maxLength={200}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">
          Organization <span className="normal-case tracking-normal text-ink/45">(optional)</span>
        </span>
        <input
          name="organization"
          maxLength={160}
          placeholder="School, lab, or company"
          className="w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-ink/65">
          Message
        </span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={4000}
          rows={5}
          placeholder={
            plan === "plus"
              ? "Tell us when you want Plus activated…"
              : plan === "campus"
                ? "Team size, research needs, timeline…"
                : "How can we help?"
          }
          className="w-full resize-y rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-accent/45 focus:ring-4 focus:ring-accent/10"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
      >
        <Send size={15} />
        {pending ? "Sending…" : "Send inquiry"}
        <ArrowUpRight size={15} />
      </button>
    </form>
  );
}
