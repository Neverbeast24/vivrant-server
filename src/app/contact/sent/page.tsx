import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Inquiry sent",
  description: "Your VIVRΛNT inquiry was received.",
};

type SentPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ContactSentPage({ searchParams }: SentPageProps) {
  const { id } = await searchParams;
  const ref = id && /^\d+$/.test(id) ? id : null;

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 size-[24rem] rounded-full bg-accent/16 blur-[90px]" />
        <div className="absolute -right-20 bottom-20 size-[22rem] rounded-full bg-cyan/14 blur-[90px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-ink/6 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Brand />
          <Link
            href="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-deep"
          >
            Get started
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center md:px-8">
        <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 size={32} />
        </span>
        <p className="mt-6 text-[11px] font-black tracking-[0.2em] text-accent">INQUIRY SENT</p>
        <h1 className="font-display mt-3 text-4xl text-ink sm:text-5xl">We got your message.</h1>
        <p className="mt-4 text-sm leading-7 text-ink/80">
          Thanks for reaching out. Our team will review your inquiry
          {ref ? (
            <>
              {" "}
              <span className="font-bold text-ink">#{ref}</span>
            </>
          ) : null}{" "}
          and follow up by email.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-black text-white transition hover:bg-accent-deep"
          >
            Create free account
            <ArrowUpRight size={15} />
          </Link>
          <Link
            href="/pricing"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-ink/12 bg-card px-6 py-3.5 text-sm font-black text-ink transition hover:border-accent/40"
          >
            Back to pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
