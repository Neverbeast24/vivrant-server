"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
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
import { CommandSearch } from "@/components/dashboard/command-search";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";

const baseNav = [
  { href: "/admin", label: "Overview", caption: "Platform pulse", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", caption: "Roles and access", icon: Users },
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
            } ${active ? "bg-[#26222f] text-white shadow-lg" : "text-[#4c4757] hover:bg-white/80 hover:text-[#26222f]"}`}
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-white/10" : "bg-[#eee8dc] group-hover:bg-[#e4ddcf]"}`}>
              <item.icon size={17} />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`block truncate text-[10px] font-semibold ${active ? "text-white/55" : "text-[#8d8794]"}`}>{item.caption}</span>
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
  children,
}: {
  displayName: string;
  isSuperAdmin: boolean;
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
    <main className="min-h-screen p-2 sm:p-3">
      <div className="glass mx-auto flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[1.6rem] border border-white/65 shadow-[0_30px_90px_rgba(54,43,34,.14)]">
        <motion.aside
          animate={{ width: expanded ? 288 : 88 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="relative hidden shrink-0 flex-col overflow-hidden border-r border-black/5 bg-[#fdfbf4]/72 p-4 lg:flex"
        >
          <div className={`mb-3 flex h-12 items-center ${expanded ? "justify-between" : "justify-center"}`}>
            <Brand compact={!expanded} />
            {expanded && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className={`grid size-9 place-items-center rounded-xl transition hover:bg-white ${collapsed ? "text-[#5f45e6]" : "text-[#807a88]"}`}
                title={collapsed ? "Pin sidebar open" : "Collapse sidebar (hover to peek)"}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>
            )}
          </div>
          {expanded && (
            <p className="mb-4 px-3 text-[10px] font-black tracking-[0.16em] text-[#5f45e6]">
              {isSuperAdmin ? "SUPER ADMIN CONSOLE" : "ADMIN CONSOLE"}
            </p>
          )}
          <AdminNavigation pathname={pathname} collapsed={!expanded} isSuperAdmin={isSuperAdmin} />
          <Link href="/dashboard" title="Back to dashboard" className={`mt-auto rounded-xl border border-black/8 bg-white/65 text-sm font-bold text-[#5f5a67] transition hover:bg-white ${expanded ? "px-3 py-2.5" : "px-2 py-3 text-center"}`}>
            {expanded ? "← Back to dashboard" : "←"}
          </Link>
        </motion.aside>

        <section className="min-w-0 flex-1 bg-[#f6f1e6]/65">
          <header className="flex h-20 items-center justify-between gap-3 border-b border-black/5 bg-[#fdfbf4]/35 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-xl bg-[#fdfbf4] shadow-sm lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
              <CommandSearch isStaff isSuperAdmin={isSuperAdmin} />
              <div className="hidden xl:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a94a0]">{isSuperAdmin ? "Super admin" : "Admin"} session</p>
                <p className="max-w-32 truncate text-xs font-bold">{displayName}</p>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#e4571f]/15 bg-[#fff6f0] px-4 py-2.5 text-xs font-black text-[#c24a1a] shadow-sm transition hover:-translate-y-0.5 hover:border-[#e4571f]/35 hover:bg-[#ffe9db]"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </header>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-[#191621]/40 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
                <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="flex h-full w-[min(88vw,20rem)] flex-col bg-[#fdfbf4] p-5">
                  <div className="mb-5 flex items-center justify-between"><Brand /><button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-[#eee8dc]"><X size={17} /></button></div>
                  <p className="mb-4 text-[10px] font-black tracking-wider text-[#5f45e6]">{isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}</p>
                  <AdminNavigation pathname={pathname} collapsed={false} isSuperAdmin={isSuperAdmin} close={() => setMobileOpen(false)} />
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="p-5 sm:p-8">
            {children}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
