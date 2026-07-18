"use client";

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
  Refrigerator,
  Settings2,
  Shield,
  ShoppingBasket,
  WalletCards,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/dashboard/actions";
import { Notifications } from "@/components/dashboard/notifications";
import { CommandSearch } from "@/components/dashboard/command-search";

const navItems = [
  { icon: LayoutDashboard, label: "Today", href: "/dashboard" },
  { icon: Apple, label: "Nutrition", href: "/dashboard/nutrition" },
  { icon: Dumbbell, label: "Movement", href: "/dashboard/movement" },
  { icon: ShoppingBasket, label: "Groceries", href: "/dashboard/groceries" },
  { icon: Refrigerator, label: "Pantry", href: "/dashboard/pantry" },
  { icon: WalletCards, label: "Spending", href: "/dashboard/spending" },
  { icon: FileBarChart, label: "Reports", href: "/dashboard/reports" },
  { icon: BrainCircuit, label: "AI Engine", href: "/dashboard/ai" },
  { icon: Settings2, label: "Settings", href: "/dashboard/settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardShell({
  displayName,
  isStaff = false,
  children,
}: {
  displayName: string;
  isStaff?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initials = displayName.trim().charAt(0).toUpperCase() || "V";

  return (
    <main className="min-h-screen p-2 sm:p-3">
      <div className="glass mx-auto flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[1.6rem] border border-white/65 shadow-[0_30px_90px_rgba(54,43,34,.14)]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-black/5 bg-[#fdfbf4]/68 p-6 lg:flex">
          <div className="mb-7 flex items-center gap-2" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57] shadow-inner" />
            <span className="size-3 rounded-full bg-[#febc2e] shadow-inner" />
            <span className="size-3 rounded-full bg-[#28c840] shadow-inner" />
          </div>
          <Brand className="mb-9" />
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                    active
                      ? "text-white"
                      : "text-[#716d78] hover:bg-[#fdfbf4]/90 hover:text-[#332f3c]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-xl bg-[#26222f] shadow-lg"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#292433] to-[#3e3156] p-4 text-white">
            <p className="text-sm font-bold">Your weekly story is ready.</p>
            <Link
              href="/dashboard/reports"
              className="mt-3 flex items-center gap-1 text-xs font-bold text-white/60 transition hover:text-white"
            >
              Open report <ChevronRight size={13} />
            </Link>
          </div>
          {isStaff && (
            <Link
              href="/admin"
              className="mt-3 flex items-center gap-3 rounded-xl bg-[#ece7fb] px-3 py-2.5 text-sm font-bold text-[#5f4fd6] transition hover:bg-[#fdfbf4]"
            >
              <Shield size={17} /> Admin console
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#77727e] transition hover:bg-[#fdfbf4]/85"
          >
            <Settings2 size={17} /> Preferences
          </Link>
        </aside>

        <section className="min-w-0 flex-1 bg-[#f6f1e6]/65">
          <header className="flex h-20 items-center justify-between gap-3 border-b border-black/5 bg-[#fdfbf4]/35 px-5 backdrop-blur-xl sm:px-8">
            <Brand compact className="lg:hidden" />
            <CommandSearch />
            <div className="flex items-center gap-2">
              <Notifications />
              <form action={signOut}>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  title="Sign out"
                  className="focus-ring group ml-1 flex items-center gap-2 rounded-full bg-[#fdfbf4] py-1.5 pl-1.5 pr-3 text-sm font-bold shadow-sm"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#ac99ff] to-[#5fd8e0] text-xs font-black text-white">
                    {initials}
                  </span>
                  <span className="hidden max-w-28 truncate sm:block">{displayName}</span>
                  <LogOut size={14} className="text-[#a7a2ae] transition group-hover:text-[#5f45e6]" />
                </motion.button>
              </form>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-black/5 px-4 py-3 lg:hidden">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-[#26222f] text-white"
                      : "bg-[#fdfbf4]/85 text-[#716d78]"
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
