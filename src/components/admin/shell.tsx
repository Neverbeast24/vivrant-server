"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/dashboard/actions";
import { CommandSearch } from "@/components/dashboard/command-search";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/admin/audit", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminShell({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen p-2 sm:p-3">
      <div className="glass mx-auto flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[1.6rem] border border-white/65 shadow-[0_30px_90px_rgba(54,43,34,.14)]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-black/5 bg-[#fdfbf4]/68 p-6 lg:flex">
          <div className="mb-7 flex items-center gap-2" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57] shadow-inner" />
            <span className="size-3 rounded-full bg-[#febc2e] shadow-inner" />
            <span className="size-3 rounded-full bg-[#28c840] shadow-inner" />
          </div>
          <Brand className="mb-8" />
          <p className="mb-4 text-[10px] font-black tracking-[0.16em] text-[#5f45e6]">
            ADMIN CONSOLE
          </p>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                    active ? "text-white" : "text-[#716d78] hover:bg-[#fdfbf4]/90"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav"
                      className="absolute inset-0 -z-10 rounded-xl bg-[#26222f] shadow-lg"
                    />
                  )}
                  <item.icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/dashboard"
            className="mt-auto rounded-xl border border-black/8 bg-[#fdfbf4]/85 px-3 py-2.5 text-sm font-bold text-[#5f5a67] transition hover:bg-[#fdfbf4]"
          >
            ← Back to dashboard
          </Link>
        </aside>

        <section className="min-w-0 flex-1 bg-[#f6f1e6]/65">
          <header className="flex h-20 items-center justify-between gap-3 border-b border-black/5 bg-[#fdfbf4]/35 px-5 backdrop-blur-xl sm:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <Brand compact className="lg:hidden" />
              <CommandSearch />
              <div className="hidden xl:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a94a0]">
                  Admin session
                </p>
                <p className="max-w-32 truncate text-xs font-bold">{displayName}</p>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#fdfbf4] px-4 py-2 text-sm font-bold shadow-sm"
              >
                <LogOut size={15} /> Sign out
              </button>
            </form>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 sm:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
