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
    <main className="min-h-screen p-3 sm:p-5">
      <div className="glass mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white/45 p-5 lg:flex">
          <Brand className="mb-8" />
          <p className="mb-4 text-[10px] font-black tracking-[0.16em] text-[#7557ff]">
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
                    active ? "text-white" : "text-[#716d78] hover:bg-white/80"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav"
                      className="absolute inset-0 -z-10 rounded-xl bg-[#24212e] shadow-lg"
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
            className="mt-auto rounded-xl border border-black/8 bg-white/70 px-3 py-2.5 text-sm font-bold text-[#5f5a67] transition hover:bg-white"
          >
            ← Back to dashboard
          </Link>
        </aside>

        <section className="min-w-0 flex-1 bg-[#f8f7fb]/65">
          <header className="flex h-20 items-center justify-between border-b border-black/5 px-5 sm:px-8">
            <div>
              <p className="text-xs font-bold text-[#8a8491]">Signed in as</p>
              <p className="font-bold">{displayName}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm"
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
