"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";

const inputShell =
  "flex items-center gap-3 rounded-2xl border border-[#26222f]/10 bg-[#fdfbf4]/90 px-4 py-3.5 shadow-sm transition focus-within:border-[#5f45e6]/40 focus-within:ring-4 focus-within:ring-[#5f45e6]/8";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not update your password.");
      }
      router.push("/dashboard");
      router.refresh();
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-xs font-bold text-[#615d69]">New password</span>
        <span className={inputShell}>
          <LockKeyhole size={17} className="text-[#9b96a1]" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-bold text-[#615d69]">Confirm password</span>
        <span className={inputShell}>
          <LockKeyhole size={17} className="text-[#9b96a1]" />
          <input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Type it again"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </span>
      </label>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        disabled={pending}
        className="focus-ring group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26222f] px-5 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(38,34,47,.18)] transition hover:bg-[#e4571f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Save new password
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </motion.button>
    </form>
  );
}
