"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

type Feedback = { tone: "error" | "notice"; text: string } | null;

const COPY: Record<Mode, { eyebrow: string; title: string; blurb: string }> = {
  signin: {
    eyebrow: "WELCOME TO VIVA",
    title: "Come back to yourself.",
    blurb: "Sign in to continue your healthier rhythm.",
  },
  signup: {
    eyebrow: "JOIN VIVA",
    title: "Start something kind.",
    blurb: "Create your private space in under a minute.",
  },
  forgot: {
    eyebrow: "RESET PASSWORD",
    title: "No worries at all.",
    blurb: "Enter your email and we'll send you a secure reset link.",
  },
};

async function postJson(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    message?: string;
  };
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data;
}

const inputShell =
  "flex items-center gap-3 rounded-2xl border border-[#26222f]/10 bg-[#fdfbf4]/90 px-4 py-3.5 shadow-sm transition focus-within:border-[#5f45e6]/40 focus-within:ring-4 focus-within:ring-[#5f45e6]/8";

export function AuthForm({
  next,
  initialError,
  initialNotice,
}: {
  next: string;
  initialError?: string;
  initialNotice?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(
    initialError
      ? { tone: "error", text: initialError }
      : initialNotice
        ? { tone: "notice", text: initialNotice }
        : null,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const copy = COPY[mode];

  function switchMode(target: Mode) {
    setMode(target);
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setPending(true);

    try {
      if (mode === "signin") {
        await postJson("/api/auth/login", { email, password });
        router.push(next);
        router.refresh();
        return; // keep the spinner while navigating
      }

      if (mode === "signup") {
        const data = await postJson("/api/auth/signup", {
          email,
          password,
          displayName,
        });
        if (data.message && /check your inbox/i.test(data.message)) {
          setFeedback({ tone: "notice", text: data.message });
        } else {
          router.push(next);
          router.refresh();
          return;
        }
      }

      if (mode === "forgot") {
        const data = await postJson("/api/auth/forgot-password", { email });
        setFeedback({
          tone: "notice",
          text: data.message ?? "Check your inbox for the reset link.",
        });
      }
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    }

    setPending(false);
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-black tracking-[0.18em] text-[#7557ff]">{copy.eyebrow}</p>
          <h2 className="font-display mt-4 text-5xl">{copy.title}</h2>
          <p className="mt-4 text-sm leading-6 text-[#7b7682]">{copy.blurb}</p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                feedback.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedback.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <AnimatePresence initial={false}>
          {mode === "signup" && (
            <motion.label
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="block overflow-hidden"
            >
              <span className="mb-2 block text-xs font-bold text-[#615d69]">Name</span>
              <span className={inputShell}>
                <UserRound size={17} className="text-[#9b96a1]" />
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </span>
            </motion.label>
          )}
        </AnimatePresence>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[#615d69]">Email</span>
          <span className={inputShell}>
            <Mail size={17} className="text-[#9b96a1]" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </span>
        </label>

        <AnimatePresence initial={false}>
          {mode !== "forgot" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-xs font-bold text-[#615d69]">
                  Password
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="focus-ring font-bold text-[#7557ff] transition hover:text-[#5a3de0]"
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <span className={inputShell}>
                  <LockKeyhole size={17} className="text-[#9b96a1]" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="At least 8 characters"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          disabled={pending}
          className="focus-ring group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26222f] px-5 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(38,34,47,.18)] transition hover:bg-[#e4571f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : mode === "forgot" ? (
            <>
              Send reset link <KeyRound size={16} />
            </>
          ) : (
            <>
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-5 text-center text-sm text-[#7b7682]">
        {mode === "signin" && (
          <>
            New to VIVA?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="focus-ring font-black text-[#7557ff] transition hover:text-[#5a3de0]"
            >
              Create an account
            </button>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="focus-ring font-black text-[#7557ff] transition hover:text-[#5a3de0]"
            >
              Sign in
            </button>
          </>
        )}
        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="focus-ring font-black text-[#7557ff] transition hover:text-[#5a3de0]"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
