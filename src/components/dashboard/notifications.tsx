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

  function onRead(id: number) {
    setReadOverrides((current) => ({ ...current, [id]: true }));
    start(async () => {
      await markNotificationRead(id);
      router.refresh();
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
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring relative grid size-10 place-items-center rounded-full bg-[#f6faf7] text-[#4f5f56] shadow-sm transition hover:-translate-y-0.5"
      >
        <Bell size={17} />
        {unread > 0 && (
          <i className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-[#ff647c]" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="glass absolute right-0 top-12 z-50 w-80 rounded-2xl p-3"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-black">Notifications</span>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={onMarkAll}
                  className="rounded-full bg-[#d7efe6] px-2.5 py-1 text-[10px] font-bold text-[#0e7c66] transition hover:bg-[#c5e8db]"
                >
                  Mark {unread} read
                </button>
              ) : (
                <span className="px-2 py-1 text-[10px] font-bold text-[#7e8e85]">All read</span>
              )}
            </div>
            <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
              {rows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRead(item.id)}
                  className={`relative flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#f6faf7]/85 ${
                    !item.is_read ? "bg-white/45" : "opacity-65"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#d7efe6] text-[#0e7c66]">
                    <Sparkles size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">{item.title}</span>
                    <span className="block truncate text-[11px] text-[#6a7a71]">{item.body}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-[#8a9a91]">
                    {timeAgo(item.created_at)}
                  </span>
                  {!item.is_read && (
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#0e7c66]" />
                  )}
                </button>
              ))}
              {!rows.length && (
                <p className="rounded-xl border border-dashed border-[#14221b]/10 px-3 py-8 text-center text-xs text-[#7a8a81]">
                  No notifications yet. Admin broadcasts and VIVRΛNT updates will show here.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
