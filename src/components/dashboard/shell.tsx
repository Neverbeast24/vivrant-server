"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Apple,
  BrainCircuit,
  ChevronRight,
  Dumbbell,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Refrigerator,
  Settings2,
  Shield,
  ShoppingBasket,
  WalletCards,
  X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/dashboard/actions";
import { Notifications } from "@/components/dashboard/notifications";
import { CommandSearch } from "@/components/dashboard/command-search";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";

const navItems = [
  { icon: LayoutDashboard, label: "Today", caption: "Your daily rhythm", href: "/dashboard" },
  { icon: Apple, label: "Nutrition", caption: "Meals and hydration", href: "/dashboard/nutrition" },
  { icon: Dumbbell, label: "Movement", caption: "Workouts and activity", href: "/dashboard/movement" },
  { icon: ShoppingBasket, label: "Groceries", caption: "Smart shopping list", href: "/dashboard/groceries" },
  { icon: Refrigerator, label: "Pantry", caption: "Stock at a glance", href: "/dashboard/pantry" },
  { icon: WalletCards, label: "Spending", caption: "Wellness budget", href: "/dashboard/spending" },
  { icon: FileBarChart, label: "Reports", caption: "Patterns and trends", href: "/dashboard/reports" },
  { icon: BrainCircuit, label: "AI Engine", caption: "Personal insights", href: "/dashboard/ai" },
  { icon: Settings2, label: "Profile", caption: "Body, goals, preferences", href: "/dashboard/settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function Navigation({
  pathname,
  collapsed = false,
  close,
}: {
  pathname: string;
  collapsed?: boolean;
  close?: () => void;
}) {
  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            title={collapsed ? item.label : undefined}
            className={`focus-ring group relative flex items-center rounded-2xl py-2.5 transition ${
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            } ${active ? "bg-[#26222f] text-white shadow-[0_10px_24px_rgba(38,34,47,.18)]" : "text-[#4c4757] hover:bg-white/80 hover:text-[#26222f]"}`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl transition ${
                active ? "bg-white/10" : "bg-[#eee8dc] group-hover:bg-[#e4ddcf]"
              }`}
            >
              <item.icon size={17} />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`block truncate text-[10px] font-semibold ${active ? "text-white/55" : "text-[#8d8794]"}`}>
                  {item.caption}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

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
        className="shrink-0 rounded-full border border-white/80 object-cover shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ac99ff] to-[#5fd8e0] text-xs font-black text-white shadow-sm"
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
  children,
}: {
  displayName: string;
  nickname?: string;
  avatarUrl?: string | null;
  isStaff?: boolean;
  isSuperAdmin?: boolean;
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
    <main className="min-h-screen p-2 sm:p-3">
      <div className="glass mx-auto flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[1.6rem] border border-white/65 shadow-[0_30px_90px_rgba(54,43,34,.14)]">
        <motion.aside
          animate={{ width: expanded ? 288 : 88 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="relative hidden shrink-0 flex-col overflow-hidden border-r border-black/5 bg-[#fdfbf4]/72 p-4 lg:flex"
        >
          <div className={`mb-6 flex h-12 items-center ${expanded ? "justify-between" : "justify-center"}`}>
            <Brand compact={!expanded} />
            {expanded && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className={`focus-ring grid size-9 place-items-center rounded-xl transition hover:bg-white ${collapsed ? "text-[#5f45e6]" : "text-[#807a88]"}`}
                title={collapsed ? "Pin sidebar open" : "Collapse sidebar (hover to peek)"}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>
            )}
          </div>

          <Navigation pathname={pathname} collapsed={!expanded} />

          <div className="mt-auto space-y-2 pt-5">
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-[#292433] to-[#493765] p-4 text-white">
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
                className={`flex items-center rounded-xl bg-[#ece7fb] text-sm font-bold text-[#5f4fd6] transition hover:bg-white ${
                  expanded ? "gap-3 px-3 py-2.5" : "justify-center p-3"
                }`}
              >
                <Shield size={17} /> {expanded && "Admin console"}
              </Link>
            )}

            <div
              className={`rounded-2xl border border-black/6 bg-white/70 ${
                expanded ? "flex items-center gap-3 p-3" : "flex flex-col items-center gap-2 p-2"
              }`}
            >
              <Link href="/dashboard/settings" title="Open profile" className="focus-ring shrink-0 rounded-full">
                <Avatar avatarUrl={avatarUrl} initials={initials} size={expanded ? 40 : 36} />
              </Link>
              {expanded && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-black text-[#332f3c]">{displayName}</span>
                  {nickname && (
                    <span className="block truncate text-[11px] font-semibold text-[#9a95a0]">@{nickname}</span>
                  )}
                </span>
              )}
              <form action={signOut} className="shrink-0">
                <button
                  type="submit"
                  title="Sign out"
                  className="focus-ring grid size-9 place-items-center rounded-xl text-[#a7a2ae] transition hover:bg-[#fff0e8] hover:text-[#c24a1a]"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </motion.aside>

        <section className="min-w-0 flex-1 bg-[#f6f1e6]/65">
          <header className="flex h-20 items-center justify-between gap-3 border-b border-black/5 bg-[#fdfbf4]/35 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="focus-ring grid size-10 place-items-center rounded-xl bg-[#fdfbf4] text-[#5f5867] shadow-sm lg:hidden" aria-label="Open navigation">
                <Menu size={18} />
              </button>
              <Brand compact className="hidden sm:inline-flex lg:hidden" />
              <CommandSearch isStaff={isStaff} isSuperAdmin={isSuperAdmin} />
            </div>
            <div className="flex items-center gap-2">
              <Notifications />
              <Link
                href="/dashboard/settings"
                title="Your profile"
                className="focus-ring ml-1 flex items-center gap-2 rounded-full bg-[#fdfbf4] py-1.5 pl-1.5 pr-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Avatar avatarUrl={avatarUrl} initials={initials} size={32} />
                <span className="hidden max-w-28 truncate leading-tight sm:block">
                  <span className="block text-xs font-black">{displayName}</span>
                  {nickname && <span className="block text-[10px] font-semibold text-[#9a95a0]">@{nickname}</span>}
                </span>
              </Link>
              <form action={signOut}>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  title="Sign out"
                  className="focus-ring group flex items-center gap-2 rounded-full border border-[#e4571f]/15 bg-[#fff6f0] px-3.5 py-2.5 text-xs font-black text-[#c24a1a] shadow-sm transition hover:border-[#e4571f]/35 hover:bg-[#ffe9db]"
                >
                  <LogOut size={14} />
                  <span className="hidden md:inline">Sign out</span>
                </motion.button>
              </form>
            </div>
          </header>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-[#191621]/40 backdrop-blur-sm lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileOpen(false)}>
                <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="flex h-full w-[min(88vw,20rem)] flex-col bg-[#fdfbf4] p-5 shadow-2xl">
                  <div className="mb-6 flex items-center justify-between">
                    <Brand />
                    <button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-[#eee8dc]" aria-label="Close navigation"><X size={17} /></button>
                  </div>
                  <Navigation pathname={pathname} close={() => setMobileOpen(false)} />
                  <div className="mt-auto space-y-2">
                    {isStaff && <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl bg-[#ece7fb] px-3 py-3 text-sm font-bold text-[#5f4fd6]"><Shield size={17} /> Admin console</Link>}
                    <div className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white/70 p-3">
                      <Avatar avatarUrl={avatarUrl} initials={initials} size={40} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-black text-[#332f3c]">{displayName}</span>
                        {nickname && <span className="block truncate text-[11px] font-semibold text-[#9a95a0]">@{nickname}</span>}
                      </span>
                      <form action={signOut}>
                        <button type="submit" title="Sign out" className="focus-ring grid size-9 place-items-center rounded-xl text-[#a7a2ae] transition hover:bg-[#fff0e8] hover:text-[#c24a1a]">
                          <LogOut size={16} />
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }} className="p-5 sm:p-8">
            {children}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
