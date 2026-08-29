"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Sparkles } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/notifications-actions";

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  href?: string | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Notifications({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readOverrides, setReadOverrides] = useState<Record<number, true>>({});
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const rows = items.map((item) =>
    readOverrides[item.id] ? { ...item, is_read: true } : item,
  );
  const unread = rows.filter((row) => !row.is_read).length;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onRead(id: number, href?: string | null) {
    setReadOverrides((current) => ({ ...current, [id]: true }));
    start(async () => {
      await markNotificationRead(id);
      router.refresh();
      if (href) router.push(href);
    });
  }

  function onMarkAll() {
    const next: Record<number, true> = {};
    for (const item of items) next[item.id] = true;
    setReadOverrides(next);
    start(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : "Notifications"
        }
        onClick={() => setOpen((value) => !value)}
        className="focus-ring relative grid size-10 place-items-center rounded-full bg-card text-muted shadow-sm transition hover:-translate-y-0.5"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff647c] px-1 text-[9px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="glass absolute right-0 top-12 z-50 w-80 rounded-[1.4rem] p-3 shadow-[0_24px_60px_rgba(var(--shadow-color),.18)]"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-black">Notifications</span>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={onMarkAll}
                  className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent transition hover:bg-accent-soft"
                >
                  Mark {unread} read
                </button>
              ) : (
                <span className="px-2 py-1 text-[10px] font-bold text-muted">All read</span>
              )}
            </div>
            <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
              {rows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRead(item.id, item.href)}
                  className={`relative flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-card/85 ${
                    !item.is_read ? "bg-panel/45" : "opacity-65"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Sparkles size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">{item.title}</span>
                    <span className="block truncate text-[11px] text-muted">{item.body}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted">
                    {timeAgo(item.created_at)}
                  </span>
                  {!item.is_read && (
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
              {!rows.length && (
                <p className="rounded-xl border border-dashed border-ink/10 px-3 py-8 text-center text-xs text-muted">
                  No notifications yet. Ticket updates, admin broadcasts, and VIVRΛNT alerts will show here.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
