"use client";

import { useEffect, useRef, useState } from "react";
import { signOutIdle } from "@/app/dashboard/actions";

/** Auto sign-out after this much time with no user interaction. */
export const SESSION_IDLE_MS = 10 * 60 * 1000;

/** Show a stay-signed-in warning this many ms before logout. */
const WARN_BEFORE_MS = 90 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
] as const;

/**
 * Client-side idle logout for authenticated dashboard/admin shells.
 * Warns ~90s before signing out; resets on pointer/keyboard activity.
 */
export function IdleSessionGuard() {
  const lastActivityRef = useRef(Date.now());
  const signingOutRef = useRef(false);
  const armRef = useRef<() => void>(() => {});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    let logoutTimer: ReturnType<typeof setTimeout> | null = null;
    let tickTimer: ReturnType<typeof setInterval> | null = null;
    let lastResetAt = 0;

    const logout = () => {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      void signOutIdle();
    };

    const arm = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      const remaining = SESSION_IDLE_MS - (Date.now() - lastActivityRef.current);
      logoutTimer = setTimeout(logout, Math.max(0, remaining));
    };
    armRef.current = arm;

    const onActivity = () => {
      const now = Date.now();
      // Throttle reset work — mousemove/scroll fire continuously.
      if (now - lastResetAt < 1000) return;
      lastResetAt = now;
      lastActivityRef.current = now;
      setSecondsLeft(null);
      arm();
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current >= SESSION_IDLE_MS) {
        logout();
        return;
      }
      arm();
    };

    const tick = () => {
      const remaining = SESSION_IDLE_MS - (Date.now() - lastActivityRef.current);
      if (remaining <= 0) {
        setSecondsLeft(null);
        logout();
        return;
      }
      if (remaining <= WARN_BEFORE_MS) {
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
      } else {
        setSecondsLeft(null);
      }
    };

    lastActivityRef.current = Date.now();
    arm();
    tickTimer = setInterval(tick, 1000);

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (tickTimer) clearInterval(tickTimer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (secondsLeft == null) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Session ending soon"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-md rounded-2xl border border-ember/30 bg-panel px-4 py-3 shadow-xl sm:inset-x-auto sm:right-4"
    >
      <p className="text-sm font-bold text-ink">
        Still there? You’ll be signed out in {secondsLeft}s.
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">
        For your privacy, we sign you out after 10 minutes without activity.
      </p>
      <button
        type="button"
        className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-black text-inverse-fg transition hover:opacity-90"
        onClick={() => {
          lastActivityRef.current = Date.now();
          setSecondsLeft(null);
          armRef.current();
        }}
      >
        Stay signed in
      </button>
    </div>
  );
}
