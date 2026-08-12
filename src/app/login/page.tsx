import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";
import { HeroPanel } from "./hero-panel";
import { SocialAuth } from "./social-auth";

export const metadata: Metadata = {
  title: "Welcome",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string; next?: string; plan?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, notice, next, plan } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";
  const planNotice =
    plan === "plus"
      ? "After you create your account, open Contact and ask us to turn on Plus."
      : plan === "campus"
        ? "After you sign in, open Contact and ask about Campus access."
        : null;
  const idleNotice =
    notice === "idle"
      ? "You were signed out after 10 minutes without activity. Please sign in again."
      : notice;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <HeroPanel />

      <section className="relative flex min-h-screen flex-col overflow-hidden px-5 py-5 sm:px-10 lg:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(circle at 90% 8%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 22rem), radial-gradient(circle at 12% 88%, color-mix(in srgb, var(--cyan) 10%, transparent), transparent 20rem)",
          }}
        />
        <Brand className="lg:hidden" />

        <div className="animate-rise mx-auto my-auto w-full max-w-md py-14">
          {planNotice ? (
            <div className="mb-5 rounded-2xl border border-accent/25 bg-accent-soft/70 px-4 py-3 text-sm leading-6 text-ink">
              {planNotice}
            </div>
          ) : null}
          <AuthForm next={safeNext} initialError={error} initialNotice={idleNotice} />

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="text-[10px] font-black tracking-[0.16em] text-muted">
              OR CONTINUE WITH
            </span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <SocialAuth next={safeNext} />

          <p className="mt-7 text-center text-[11px] leading-5 text-muted/90">
            By continuing, you agree to use VIVRΛNT for wellness guidance only.
            It does not replace professional medical care.
          </p>
        </div>
      </section>
    </main>
  );
}
