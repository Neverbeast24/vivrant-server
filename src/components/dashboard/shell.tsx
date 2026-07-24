"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/dashboard/actions";
import {
  Notifications,
  type NotificationItem,
} from "@/components/dashboard/notifications";
import { PushEnrollment } from "@/components/dashboard/push-enrollment";
import { CommandSearch } from "@/components/dashboard/command-search";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { ThemeSync } from "@/components/theme-sync";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";

function Avatar({
  avatarUrl,
  initials,
  size = 40,
}: {
  avatarUrl: string | null;
  initials: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full border border-panel/80 object-cover shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan text-xs font-black text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function DashboardShell({
  displayName,
  nickname,
  avatarUrl = null,
  isStaff = false,
  isSuperAdmin = false,
  notifications = [],
  pushEnabled = true,
  theme = null,
  children,
}: {
  displayName: string;
  nickname?: string;
  avatarUrl?: string | null;
  isStaff?: boolean;
  isSuperAdmin?: boolean;
  notifications?: NotificationItem[];
  pushEnabled?: boolean;
  theme?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = displayName.trim().charAt(0).toUpperCase() || "V";
  const expanded = !collapsed || hovering;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCollapsed]);

  return (
    <main className="h-dvh overflow-hidden p-2 sm:p-3">
      <ThemeSync theme={theme} />
      <PushEnrollment enabled={pushEnabled} />
      <div className="glass mx-auto flex h-full w-full overflow-hidden rounded-[1.6rem] border border-panel/65 shadow-[0_30px_90px_rgba(var(--shadow-color),.14)]">
        <motion.aside
          animate={{ width: expanded ? 288 : 88 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-ink/5 bg-card/72 p-4 lg:flex"
        >
          <div className={`mb-6 flex h-12 shrink-0 items-center ${expanded ? "justify-between gap-2" : "justify-center"}`}>
            <Brand compact={!expanded} />
            {expanded && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className={`focus-ring grid size-9 place-items-center rounded-xl transition hover:bg-panel ${collapsed ? "text-accent" : "text-muted"}`}
                title={collapsed ? "Pin sidebar open" : "Collapse sidebar (hover to peek)"}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <DashboardNavigation collapsed={!expanded} />
          </div>

          <div className="mt-3 shrink-0 space-y-2 pt-2">
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-solid to-accent-deep p-4 text-solid-fg">
                <p className="text-sm font-bold">Your weekly story is ready.</p>
                <Link href="/dashboard/reports" className="mt-3 flex items-center gap-1 text-xs font-bold text-white/60 transition hover:text-white">
                  Open report <ChevronRight size={13} />
                </Link>
              </motion.div>
            )}
            {isStaff && (
              <Link
                href="/admin"
                title="Admin console"
                className={`flex items-center rounded-xl bg-accent-soft text-sm font-bold text-accent transition hover:bg-panel ${
                  expanded ? "gap-3 px-3 py-2.5" : "justify-center p-3"
                }`}
              >
                <Shield size={17} /> {expanded && "Admin console"}
              </Link>
            )}

            <div
              className={`rounded-2xl border border-ink/6 bg-panel/70 ${
                expanded ? "flex items-center gap-3 p-3" : "flex flex-col items-center gap-2 p-2"
              }`}
            >
              <Link href="/dashboard/settings" title="Open profile" className="focus-ring shrink-0 rounded-full">
                <Avatar avatarUrl={avatarUrl} initials={initials} size={expanded ? 40 : 36} />
              </Link>
              {expanded && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-black text-ink">{displayName}</span>
                  {nickname && (
                    <span className="block truncate text-[11px] font-semibold text-muted">@{nickname}</span>
                  )}
                </span>
              )}
              <form action={signOut} className="shrink-0">
                <button
                  type="submit"
                  title="Sign out"
                  className="focus-ring grid size-9 place-items-center rounded-xl text-muted transition hover:bg-accent-soft hover:text-accent"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </motion.aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper/65">
          <header className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-ink/5 bg-card/35 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="focus-ring grid size-10 place-items-center rounded-xl bg-card text-muted shadow-sm lg:hidden" aria-label="Open navigation">
                <Menu size={18} />
              </button>
              <Brand compact className="hidden sm:inline-flex lg:hidden" />
              <CommandSearch isStaff={isStaff} isSuperAdmin={isSuperAdmin} />
            </div>
            <div className="flex items-center gap-2">
              <Notifications items={notifications} />
              <Link
                href="/dashboard/settings"
                title="Your profile"
                className="focus-ring ml-1 flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Avatar avatarUrl={avatarUrl} initials={initials} size={32} />
                <span className="hidden max-w-28 truncate leading-tight sm:block">
                  <span className="block text-xs font-black">{displayName}</span>
                  {nickname && <span className="block text-[10px] font-semibold text-muted">@{nickname}</span>}
                </span>
              </Link>
              <form action={signOut}>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  title="Sign out"
                  className="focus-ring group flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3.5 py-2.5 text-xs font-black text-accent shadow-sm transition hover:border-accent/40 hover:bg-accent/15"
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Sign out</span>
                </motion.button>
              </form>
            </div>
          </header>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-solid/40 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
                <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="flex h-full w-[min(88vw,20rem)] flex-col bg-card p-5 shadow-2xl">
                  <div className="mb-6 flex shrink-0 items-center justify-between">
                    <Brand />
                    <button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-surface-soft" aria-label="Close navigation"><X size={17} /></button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <DashboardNavigation close={() => setMobileOpen(false)} />
                  </div>
                  <div className="mt-4 shrink-0 space-y-2">
                    {isStaff && <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl bg-accent-soft px-3 py-3 text-sm font-bold text-accent"><Shield size={17} /> Admin console</Link>}
                    <div className="flex items-center gap-3 rounded-2xl border border-ink/6 bg-panel/70 p-3">
                      <Avatar avatarUrl={avatarUrl} initials={initials} size={40} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-black text-ink">{displayName}</span>
                        {nickname && <span className="block truncate text-[11px] font-semibold text-muted">@{nickname}</span>}
                      </span>
                      <form action={signOut}>
                        <button type="submit" title="Sign out" className="focus-ring grid size-9 place-items-center rounded-xl text-muted transition hover:bg-accent-soft hover:text-accent">
                          <LogOut size={16} />
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="p-5 sm:p-8">
              {children}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
