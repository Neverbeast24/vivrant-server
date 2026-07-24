import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { SITE_CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Pricing",
  description: "VIVRΛNT Starter is free. Plus is ₱299/month. Campus is custom for teams and research.",
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    blurb: "Build a healthier daily rhythm with the core modules.",
    features: [
      "Today dashboard & check-ins",
      "Nutrition, movement & spending logs",
      "Pantry & grocery planner",
      "Basic AI insights",
    ],
    cta: "Get started free",
    href: "/login",
    highlight: false,
  },
  {
    name: "Plus",
    price: "₱299",
    period: "/ month",
    blurb: "Full AI coaching — request access and we activate your account.",
    features: [
      "Everything in Starter",
      "Ask VIVRΛNT unlimited chat",
      "Gym demos, machines & AI plans",
      "Full weekly reports & reminders",
    ],
    cta: "Get Plus access",
    href: "/contact?plan=plus",
    highlight: true,
  },
  {
    name: "Campus",
    price: "Custom",
    period: "research & teams",
    blurb: `Contact ${SITE_CONTACT.name} for admin roles and program setup.`,
    features: [
      "Everything in Plus",
      "Admin & super-admin roles",
      "Audit logs & member activity",
      "Dedicated setup help",
    ],
    cta: "Contact for access",
    href: "/contact?plan=campus",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-28 top-16 size-[24rem] rounded-full bg-accent/16 blur-[90px]" />
        <div className="absolute -right-20 top-1/3 size-[22rem] rounded-full bg-cyan/14 blur-[90px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-ink/6 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Brand />
          <div className="flex items-center gap-3 text-sm font-semibold text-ink/75 sm:gap-6">
            <Link href="/about" className="transition-colors hover:text-accent">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-accent">
              Contact
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

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pt-20">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-black tracking-[0.2em] text-accent">PRICING</p>
          <h1 className="font-display mt-4 text-5xl leading-tight text-ink sm:text-6xl">
            Start free. Grow when you&apos;re ready.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
            Plus and Campus are activated through{" "}
            <span className="font-bold text-ink">{SITE_CONTACT.name}</span> — email{" "}
            {SITE_CONTACT.email} or call {SITE_CONTACT.phoneDisplay}.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-[2rem] p-7 sm:p-8 ${
                plan.highlight
                  ? "border-2 border-accent bg-inverse text-inverse-fg shadow-[0_24px_60px_rgba(14,124,102,.28)]"
                  : "border border-ink/8 bg-card/90 shadow-[0_16px_40px_rgba(var(--shadow-color),.06)]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-[10px] font-black tracking-wider text-white">
                  MOST POPULAR
                </span>
              )}
              <p
                className={`text-xs font-black tracking-[0.18em] ${
                  plan.highlight ? "text-cyan" : "text-accent"
                }`}
              >
                {plan.name.toUpperCase()}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-5xl tracking-tight">{plan.price}</span>
                <span
                  className={`mb-2 text-sm font-semibold ${
                    plan.highlight ? "text-inverse-fg/70" : "text-muted"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mt-3 text-sm leading-6 ${
                  plan.highlight ? "text-inverse-fg/80" : "text-muted"
                }`}
              >
                {plan.blurb}
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${plan.highlight ? "text-cyan" : "text-accent"}`}
                    />
                    <span className={plan.highlight ? "text-inverse-fg/90" : "text-ink/80"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-panel text-ink hover:bg-accent-soft"
                    : "bg-inverse text-inverse-fg hover:bg-accent"
                }`}
              >
                {plan.cta}
                <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
