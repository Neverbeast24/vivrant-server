"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Shield,
  Users,
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
import { ThemeSync } from "@/components/theme-sync";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";

const baseNav = [
  { href: "/admin", label: "Overview", caption: "Platform pulse", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", caption: "Roles and access", icon: Users },
  { href: "/admin/tickets", label: "Tickets", caption: "Bugs & support", icon: LifeBuoy },
  { href: "/admin/roles", label: "Permissions", caption: "Access model", icon: Shield },
  { href: "/admin/audit", label: "Audit logs", caption: "Admin changes", icon: ClipboardList },
  { href: "/admin/settings", label: "System", caption: "Service health", icon: Settings2 },
];

function activePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function AdminNavigation({
  pathname,
  collapsed,
  isSuperAdmin,
  close,
}: {
  pathname: string;
  collapsed: boolean;
  isSuperAdmin: boolean;
  close?: () => void;
}) {
  const nav = isSuperAdmin
    ? [
        ...baseNav.slice(0, 2),
        { href: "/admin/activity", label: "Member activity", caption: "All user logs", icon: Activity },
        ...baseNav.slice(2),
      ]
    : baseNav;

  return (
    <nav className="space-y-1.5">
      {nav.map((item) => {
        const active = activePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            title={collapsed ? item.label : undefined}
            className={`focus-ring group relative flex items-center rounded-2xl py-2.5 transition ${
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            } ${active ? "bg-inverse text-inverse-fg shadow-lg" : "text-muted hover:bg-panel/80 hover:text-ink"}`}
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-inverse-fg/10" : "bg-surface-soft group-hover:bg-surface-soft"}`}>
              <item.icon size={17} />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`block truncate text-[10px] font-semibold ${active ? "text-inverse-fg/55" : "text-muted"}`}>{item.caption}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  displayName,
  isSuperAdmin,
  notifications = [],
  pushEnabled = true,
  theme = null,
  children,
}: {
  displayName: string;
  isSuperAdmin: boolean;
  notifications?: NotificationItem[];
  pushEnabled?: boolean;
  theme?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
          <div className={`mb-3 flex h-12 shrink-0 items-center ${expanded ? "justify-between gap-2" : "justify-center"}`}>
            <Brand compact={!expanded} />
            {expanded && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className={`grid size-9 place-items-center rounded-xl transition hover:bg-panel ${collapsed ? "text-accent" : "text-muted"}`}
                title={collapsed ? "Pin sidebar open" : "Collapse sidebar (hover to peek)"}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>
            )}
          </div>
          {expanded && (
            <p className="mb-4 shrink-0 px-3 text-[10px] font-black tracking-[0.16em] text-accent">
              {isSuperAdmin ? "SUPER ADMIN CONSOLE" : "ADMIN CONSOLE"}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <AdminNavigation pathname={pathname} collapsed={!expanded} isSuperAdmin={isSuperAdmin} />
          </div>
          <Link
            href="/dashboard"
            title="Back to dashboard"
            className={`mt-3 shrink-0 rounded-xl border border-ink/8 bg-panel/65 text-sm font-bold text-muted transition hover:bg-panel ${expanded ? "px-3 py-2.5" : "px-2 py-3 text-center"}`}
          >
            {expanded ? "← Back to dashboard" : "←"}
          </Link>
        </motion.aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper/65">
          <header className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-ink/5 bg-card/35 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-xl bg-card shadow-sm lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
              <CommandSearch isStaff isSuperAdmin={isSuperAdmin} />
              <div className="hidden xl:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{isSuperAdmin ? "Super admin" : "Admin"} session</p>
                <p className="max-w-32 truncate text-xs font-bold">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Notifications items={notifications} />
              <form action={signOut}>
                <button
                  type="submit"
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-4 py-2.5 text-xs font-black text-accent shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/15"
                >
                  <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </header>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-solid/40 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
                <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="flex h-full w-[min(88vw,20rem)] flex-col bg-card p-5">
                  <div className="mb-5 flex shrink-0 items-center justify-between"><Brand /><button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-surface-soft"><X size={17} /></button></div>
                  <p className="mb-4 shrink-0 text-[10px] font-black tracking-wider text-accent">{isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}</p>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AdminNavigation pathname={pathname} collapsed={false} isSuperAdmin={isSuperAdmin} close={() => setMobileOpen(false)} />
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="mt-4 shrink-0 rounded-xl border border-ink/8 bg-panel px-3 py-2.5 text-sm font-bold text-muted">
                    ← Back to dashboard
                  </Link>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="p-5 sm:p-8">
              {children}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
