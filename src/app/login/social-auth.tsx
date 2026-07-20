"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

export function SocialAuth({ next }: { next?: string }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: Provider) {
    setError(null);
    setPending(provider);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/confirm${
        next ? `?next=${encodeURIComponent(next)}` : ""
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        setError(error.message);
        setPending(null);
      }
      // On success the browser is redirected to the provider.
    } catch {
      setError("Could not start sign in. Check your connection and try again.");
      setPending(null);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={pending !== null}
          onClick={() => signInWith("google")}
          className="focus-ring flex w-full items-center justify-center gap-3 rounded-2xl border border-[#14221b]/10 bg-[#f6faf7] px-4 py-3.5 text-sm font-black text-[#4e4956] shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "google" ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.56l3.35-2.63Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z"
              />
            </svg>
          )}
          Google
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={pending !== null}
          onClick={() => signInWith("github")}
          className="focus-ring flex w-full items-center justify-center gap-3 rounded-2xl border border-black/8 bg-[#14221b] px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "github" ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-4.5 fill-current" aria-hidden="true">
              <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.19 1.78 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.58-.29-5.29-1.29-5.29-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.98 10.98 0 0 1 12 6.1c.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.72 5.39-5.3 5.68.42.36.79 1.07.79 2.16v3.25c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
            </svg>
          )}
          GitHub
        </motion.button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
