import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Brand } from "@/components/brand";
import {
  SITE_CONTACT,
  contactMailto,
  contactSmsHref,
  contactTelHref,
  type ContactPlan,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request VIVRΛNT Plus or Campus access, or reach Daniella D. Sayson.",
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
      "Full AI coaching, gym plans, weekly stories, and reminders. Message Daniella to activate Plus — she’ll confirm billing and turn on your account.",
  },
  campus: {
    eyebrow: "CAMPUS · TEAMS & RESEARCH",
    title: "Request Campus access",
    blurb:
      "Admin roles, member activity, and setup help for programs. Email or call with your organization details and we’ll get you onboarded.",
  },
  general: {
    eyebrow: "CONTACT",
    title: "We’re here to help",
    blurb:
      "Questions about Starter, Plus, Campus, or partnerships? Reach Daniella by email or phone — replies usually come the same day.",
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
          <div className="flex items-center gap-3 text-sm font-semibold text-muted sm:gap-6">
            <Link href="/about" className="transition-colors hover:text-accent">
              About
            </Link>
            <Link href="/#pricing" className="transition-colors hover:text-accent">
              Pricing
            </Link>
            <Link
              href="/login"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-inverse px-4 py-2.5 text-sm font-bold text-inverse-fg transition hover:bg-accent"
            >
              Get started
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-16 md:px-8 lg:grid-cols-[1.1fr_.9fr] lg:pt-24">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-accent">{copy.eyebrow}</p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] text-ink sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{copy.blurb}</p>

          <div className="mt-10 space-y-3">
            <a
              href={contactMailto(plan)}
              className="focus-ring flex items-center gap-4 rounded-[1.4rem] border border-ink/8 bg-card/90 p-5 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)] transition hover:-translate-y-0.5 hover:border-accent/30"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-white">
                <Mail size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-ink">Email {SITE_CONTACT.name}</p>
                <p className="truncate text-sm text-muted">{SITE_CONTACT.email}</p>
              </div>
              <ArrowUpRight size={16} className="shrink-0 text-accent" />
            </a>

            <a
              href={contactTelHref()}
              className="focus-ring flex items-center gap-4 rounded-[1.4rem] border border-ink/8 bg-card/90 p-5 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)] transition hover:-translate-y-0.5 hover:border-accent/30"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-inverse text-inverse-fg">
                <Phone size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-ink">Call or save the number</p>
                <p className="text-sm text-muted">{SITE_CONTACT.phoneDisplay}</p>
              </div>
              <ArrowUpRight size={16} className="shrink-0 text-accent" />
            </a>

            <a
              href={contactSmsHref()}
              className="focus-ring flex items-center gap-4 rounded-[1.4rem] border border-ink/8 bg-card/90 p-5 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)] transition hover:-translate-y-0.5 hover:border-accent/30"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <MessageCircle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-ink">Text message</p>
                <p className="text-sm text-muted">Opens SMS to {SITE_CONTACT.phoneDisplay}</p>
              </div>
              <ArrowUpRight size={16} className="shrink-0 text-accent" />
            </a>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-ink/8 bg-solid p-8 text-solid-fg sm:p-10">
          <p className="text-xs font-black tracking-[0.18em] text-cyan">QUICK PATHS</p>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-solid-fg/85">
            <li>
              <span className="font-black text-solid-fg">Starter (free)</span> — create an account
              anytime and start logging your rhythm.
            </li>
            <li>
              <span className="font-black text-solid-fg">Plus (₱299/mo)</span> — email with subject
              “Plus access” after you sign up so we can activate coaching features for you.
            </li>
            <li>
              <span className="font-black text-solid-fg">Campus</span> — share your org, team size,
              and research needs; we’ll set roles and onboarding.
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-panel px-5 py-3 text-sm font-black text-ink transition hover:bg-accent-soft"
            >
              Create free account
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/#pricing"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-panel/20 px-5 py-3 text-sm font-black text-solid-fg/90 transition hover:bg-panel/10"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-8 text-xs leading-5 text-solid-fg/65">
            Prefer a pre-filled email? Use the buttons on the left — they open your mail app with
            the right subject and a short template for {SITE_CONTACT.name}.
          </p>
        </aside>
      </section>
    </main>
  );
}
