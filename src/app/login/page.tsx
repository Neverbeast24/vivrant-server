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
      ? "After you create your account, open Contact → Get Plus access (or email saysondaniella.ds24@gmail.com) to activate ₱299/mo Plus."
      : plan === "campus"
        ? "Campus access is arranged manually. Email or call Daniella D. Sayson after you sign in."
        : null;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <HeroPanel />

      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-16">
        <Brand className="lg:hidden" />

        <div className="animate-rise mx-auto my-auto w-full max-w-md py-14">
          {planNotice ? (
            <div className="mb-5 rounded-2xl border border-accent/25 bg-accent-soft/70 px-4 py-3 text-sm leading-6 text-ink">
              {planNotice}
            </div>
          ) : null}
          <AuthForm next={safeNext} initialError={error} initialNotice={notice} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/12" />
            <span className="text-[10px] font-black tracking-[0.16em] text-muted">
              OR CONTINUE WITH
            </span>
            <span className="h-px flex-1 bg-ink/12" />
          </div>

          <SocialAuth next={safeNext} />

          <p className="mt-6 text-center text-[11px] leading-5 text-muted">
            By continuing, you agree to use VIVRΛNT for wellness guidance only.
            It does not replace professional medical care.
          </p>
        </div>
      </section>
    </main>
  );
}
