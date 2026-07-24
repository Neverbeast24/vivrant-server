import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Brand } from "@/components/brand";

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
    blurb: "Send an inquiry for admin roles and program setup.",
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
          <div className="flex items-center gap-3 text-sm font-semibold text-ink/80 sm:gap-6">
            <Link href="/about" className="transition-colors hover:text-accent">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-accent">
              Contact
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

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pt-20">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-black tracking-[0.2em] text-accent">PRICING</p>
          <h1 className="font-display mt-4 text-5xl leading-tight text-ink sm:text-6xl">
            Start free. Grow when you&apos;re ready.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink/80">
            Plus and Campus are activated after you send an inquiry. The team reviews requests in
            the admin inbox.
          </p>
          <p className="mx-auto mt-3">
            <Link
              href="/contact"
              className="text-sm font-bold text-accent underline-offset-2 hover:underline"
            >
              Open the inquiry form →
            </Link>
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-[2rem] p-7 sm:p-8 ${
                plan.highlight
                  ? "border-2 border-accent bg-[#d7efe6] text-[#14221b] shadow-[0_24px_60px_rgba(14,124,102,.28)] dark:bg-[#0f2f28] dark:text-[#f2faf6]"
                  : "border border-ink/15 bg-card text-ink shadow-[0_16px_40px_rgba(var(--shadow-color),.06)]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-[10px] font-black tracking-wider text-white">
                  MOST POPULAR
                </span>
              )}
              <p
                className={`text-xs font-black tracking-[0.18em] ${
                  plan.highlight ? "text-[#0e7c66] dark:text-[#5ee0c8]" : "text-accent"
                }`}
              >
                {plan.name.toUpperCase()}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span
                  className={`font-display text-5xl tracking-tight ${
                    plan.highlight ? "text-[#14221b] dark:text-[#f2faf6]" : "text-ink"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`mb-2 text-sm font-semibold ${
                    plan.highlight ? "text-[#2f453c] dark:text-[#c5ddd3]" : "text-ink/70"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mt-3 text-sm leading-6 ${
                  plan.highlight ? "text-[#24382f] dark:text-[#d5ebe2]" : "text-ink/80"
                }`}
              >
                {plan.blurb}
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2.5 text-sm ${
                      plan.highlight ? "text-[#1a2c24] dark:text-[#e8f6f0]" : "text-ink"
                    }`}
                  >
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        plan.highlight ? "text-[#0e7c66] dark:text-[#5ee0c8]" : "text-accent"
                      }`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-[#0e7c66] text-white hover:bg-[#0a5c4c] dark:bg-[#3db896] dark:text-[#0f1612] dark:hover:bg-[#5ee0c8]"
                    : "bg-ink text-panel hover:bg-accent hover:text-white"
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
