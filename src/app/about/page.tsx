import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, HeartPulse, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "VIVRΛNT helps people make healthier daily choices through personalized recommendations — nutrition, movement, spending, and AI coaching in one rhythm.",
};

const pillars = [
  {
    icon: HeartPulse,
    title: "One connected rhythm",
    copy: "Today, nutrition, movement, gym, sleep, hydration, habits, journal, pantry, groceries, and spending share one context — so advice isn’t fragmented.",
  },
  {
    icon: Sparkles,
    title: "Useful intelligence",
    copy: "Ask VIVRΛNT, weekly stories, gym plans, and reminders are grounded in what you actually logged — not generic tips.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    copy: "Supabase Auth and row-level security keep your records yours. Guidance never replaces professional medical care.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-20 size-[28rem] rounded-full bg-accent/18 blur-[100px]" />
        <div className="absolute -right-24 top-1/3 size-[24rem] rounded-full bg-cyan/16 blur-[90px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-ink/6 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Brand />
          <div className="flex items-center gap-3 text-sm font-semibold text-ink/80 sm:gap-6">
            <Link href="/pricing" className="transition-colors hover:text-accent">
              Pricing
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

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-24">
        <p className="text-[11px] font-black tracking-[0.2em] text-accent">ABOUT VIVRΛNT</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] text-ink sm:text-6xl">
          Long live life —{" "}
          <span className="gradient-text italic">every choice shapes your health.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          VIVRΛNT (from <em>vibrant</em>, with Latin <em>vivere</em> — to live) turns everyday
          signals into a clear personal rhythm for nutrition, movement, goals, and mindful
          spending. It is an intelligent companion for healthier daily decisions — not another
          pile of disconnected trackers.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-solid p-8 text-solid-fg sm:p-10">
            <span className="text-xs font-black tracking-[0.2em] text-cyan">OUR MISSION</span>
            <h2 className="font-display mt-6 max-w-lg text-3xl leading-tight sm:text-4xl">
              Smarter daily decisions, not another pile of health data.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-solid-fg/80">
              We help people understand what to do next through personalized recommendations
              shaped by real routines — meals, workouts, sleep, mood, and spending included.
            </p>
          </article>
          <article className="rounded-[2rem] border border-ink/8 bg-gradient-to-br from-accent-soft to-card p-8 sm:p-10">
            <span className="text-xs font-black tracking-[0.2em] text-accent">OUR VISION</span>
            <h2 className="font-display mt-6 max-w-lg text-3xl leading-tight sm:text-4xl">
              An intelligent companion for healthier everyday choices.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-muted">
              Nutrition, gym, habits, journal, pantry, budgeting, and AI coaching become one
              connected experience built around your goals — private, practical, and calm.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-accent">WHAT WE STAND FOR</p>
            <h2 className="font-display mt-3 text-4xl">Built around clarity.</h2>
          </div>
          <Leaf className="hidden size-8 text-accent sm:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.6rem] border border-ink/8 bg-card/90 p-6 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)]"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
                <item.icon size={18} />
              </span>
              <h3 className="mt-5 text-lg font-black text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="rounded-[2rem] border border-ink/8 bg-card/85 p-8 sm:p-10">
          <p className="text-xs font-black tracking-[0.2em] text-accent">CONTACT</p>
          <h2 className="font-display mt-3 text-3xl text-ink">Talk to the team</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            For Plus activation, Campus / research access, or partnership questions, send an
            inquiry — our team reviews requests in the admin inbox and follows up by email.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-black text-white transition hover:bg-accent-deep"
            >
              Send an inquiry
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/pricing"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/12 bg-surface px-5 py-3 text-sm font-black text-ink transition hover:border-accent/40"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/8 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs font-semibold text-muted md:flex-row md:px-8">
          <Brand />
          <div className="flex flex-wrap gap-5">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <Link href="/#pricing" className="hover:text-accent">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-accent">
              Contact
            </Link>
            <Link href="/login" className="hover:text-accent">
              Get started
            </Link>
          </div>
          <p>© {new Date().getFullYear()} VIVRΛNT · Long live life</p>
        </div>
      </footer>
    </main>
  );
}
