import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MessageSquareText, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { InquiryForm } from "@/components/inquiry-form";
import type { ContactPlan } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a VIVRΛNT inquiry for Plus, Campus, or general questions.",
};

type ContactPageProps = {
  searchParams: Promise<{ plan?: string }>;
};

function resolvePlan(raw?: string): ContactPlan {
  if (raw === "plus" || raw === "campus") return raw;
  return "general";
}

const planCopy: Record<
  ContactPlan,
  { eyebrow: string; title: string; blurb: string }
> = {
  plus: {
    eyebrow: "PLUS · ₱299 / MONTH",
    title: "Request Plus access",
    blurb:
      "Full AI coaching, gym plans, weekly stories, and reminders. Send an inquiry and our team will follow up to activate Plus.",
  },
  campus: {
    eyebrow: "CAMPUS · TEAMS & RESEARCH",
    title: "Request Campus access",
    blurb:
      "Admin roles, member activity, and setup help for programs. Share your organization details and we’ll get back to you.",
  },
  general: {
    eyebrow: "CONTACT",
    title: "We’re here to help",
    blurb:
      "Questions about Starter, Plus, Campus, or partnerships? Send an inquiry and the VIVRΛNT team will reply by email.",
  },
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { plan: rawPlan } = await searchParams;
  const plan = resolvePlan(rawPlan);
  const copy = planCopy[plan];

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 size-[24rem] rounded-full bg-accent/16 blur-[90px]" />
        <div className="absolute -right-20 bottom-20 size-[22rem] rounded-full bg-cyan/14 blur-[90px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-ink/6 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Brand />
          <div className="flex items-center gap-3 text-sm font-semibold text-ink/80 sm:gap-6">
            <Link href="/about" className="transition-colors hover:text-accent">
              About
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-accent">
              Pricing
            </Link>
            <Link
              href="/login"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-deep"
            >
              Get started
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-16 md:px-8 md:pt-20">
        <p className="text-[11px] font-black tracking-[0.2em] text-accent">{copy.eyebrow}</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] text-ink sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/80">{copy.blurb}</p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-24 md:px-8 lg:grid-cols-[1.15fr_.85fr]">
        <InquiryForm defaultPlan={plan} />

        <div className="space-y-3">
          <div className="rounded-[1.4rem] border border-ink/8 bg-card/90 p-5 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)]">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-white">
              <MessageSquareText size={18} />
            </span>
            <p className="mt-4 text-sm font-black text-ink">How it works</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">
              Submit the form, get a confirmation page, and we review your request in the admin
              inquiry inbox.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-ink/8 bg-accent-soft/80 p-6">
            <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.16em] text-accent">
              <Sparkles size={14} /> QUICK PATHS
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
              <li>
                <span className="font-black text-ink">Starter</span> — free account anytime via Get
                started.
              </li>
              <li>
                <span className="font-black text-ink">Plus</span> — ₱299/mo after we confirm your
                inquiry.
              </li>
              <li>
                <span className="font-black text-ink">Campus</span> — custom setup for research and
                teams.
              </li>
            </ul>
            <Link
              href="/login"
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-black text-white transition hover:bg-accent-deep"
            >
              Create free account
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
