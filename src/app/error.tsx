"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-5">
      <section className="w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-panel/75 bg-card/90 shadow-[0_30px_90px_rgba(54,43,34,.16)] backdrop-blur-xl">
        <div className="flex h-11 items-center border-b border-ink/6 bg-panel/35 px-4">
          <div className="flex gap-2" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="mx-auto pr-12 text-xs font-bold text-muted">VIVRΛNT</span>
        </div>
        <div className="p-8 sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-ember/15 text-ember">
            <TriangleAlert size={21} />
          </span>
          <h1 className="font-display mt-6 text-3xl">This page took a pause.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            VIVRΛNT could not finish loading this view. Your saved health data is safe;
            retry the request or return to your dashboard.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-[10px] text-muted">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-inverse px-4 py-3 text-sm font-black text-inverse-fg transition hover:-translate-y-0.5 hover:bg-accent"
            >
              <RefreshCw size={15} /> Try again
            </button>
            <Link
              href="/dashboard"
              className="focus-ring rounded-xl border border-ink/8 bg-panel/60 px-4 py-3 text-sm font-black text-ink transition hover:bg-panel"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
