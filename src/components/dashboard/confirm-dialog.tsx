"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmOptions & { open: boolean };

const DEFAULT: ConfirmState = {
  open: false,
  title: "Are you sure?",
  body: "",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
};

let state: ConfirmState = DEFAULT;
let resolver: ((value: boolean) => void) | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function close(value: boolean) {
  const done = resolver;
  resolver = null;
  state = { ...state, open: false };
  emit();
  done?.(value);
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (resolver) resolver(false);
  state = {
    open: true,
    title: options.title,
    body: options.body,
    confirmLabel: options.confirmLabel ?? "Archive",
    cancelLabel: options.cancelLabel ?? "Cancel",
  };
  emit();
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

export function confirmDelete(label: string) {
  return confirmAction({
    title: `Archive ${label}?`,
    body: "It will leave this list and move to Archived. You can restore it anytime from Profile → Archived.",
    confirmLabel: "Archive",
  });
}

export function confirmDeleteMany(count: number) {
  const n = Math.max(0, count);
  return confirmAction({
    title: `Archive ${n} item${n === 1 ? "" : "s"}?`,
    body: "They will leave this list and move to Archived. You can restore them anytime from Profile → Archived.",
    confirmLabel: "Archive",
  });
}

export function confirmRestoreMany(count: number) {
  const n = Math.max(0, count);
  return confirmAction({
    title: `Restore ${n} item${n === 1 ? "" : "s"}?`,
    body: "They will come back to their original module lists.",
    confirmLabel: "Restore",
  });
}

export function ConfirmHost() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const onCancel = useCallback(() => close(false), []);
  const onConfirm = useCallback(() => close(true), []);

  if (!current.open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[1.6rem] border border-ink/10 bg-card p-6 shadow-[inset_0_1px_0_var(--glass-inset),0_24px_60px_rgba(var(--shadow-color),.28)]"
      >
        <h2 id="confirm-title" className="font-display text-2xl tracking-tight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-muted">{current.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl px-4 py-2.5 text-sm font-black text-muted transition hover:bg-ink/5 hover:text-ink"
          >
            {current.cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-inverse px-4 py-2.5 text-sm font-black text-inverse-fg transition hover:bg-accent"
          >
            {current.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
