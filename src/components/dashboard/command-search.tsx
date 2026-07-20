"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Apple,
  BrainCircuit,
  Command,
  Dumbbell,
  FileBarChart,
  LayoutDashboard,
  LoaderCircle,
  Refrigerator,
  Search,
  Settings2,
  Shield,
  ShoppingBasket,
  Users,
  WalletCards,
  Weight,
  X,
} from "lucide-react";

const dashboardDestinations = [
  { label: "Today", detail: "Daily health overview and quick check-in", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview mood energy water steps" },
  { label: "Nutrition", detail: "Log meals, calories, and protein", href: "/dashboard/nutrition", icon: Apple, keywords: "food meal calorie protein diet" },
  { label: "Movement", detail: "Record workouts and activity", href: "/dashboard/movement", icon: Dumbbell, keywords: "exercise workout calories minutes steps" },
  { label: "Gym", detail: "Demo videos, AI plans, and gym sessions", href: "/dashboard/gym", icon: Weight, keywords: "gym demo video training plan strength" },
  { label: "Groceries", detail: "Manage your shopping list", href: "/dashboard/groceries", icon: ShoppingBasket, keywords: "shopping food list buy" },
  { label: "Pantry", detail: "Track food and stock levels", href: "/dashboard/pantry", icon: Refrigerator, keywords: "inventory kitchen stock" },
  { label: "Spending", detail: "Review health and grocery expenses", href: "/dashboard/spending", icon: WalletCards, keywords: "money expense budget cost" },
  { label: "Reports", detail: "See trends across your wellbeing", href: "/dashboard/reports", icon: FileBarChart, keywords: "analytics trends weekly data" },
  { label: "AI Engine", detail: "Ask VIVA about your health data", href: "/dashboard/ai", icon: BrainCircuit, keywords: "assistant insight ask recommendation" },
  { label: "Profile & settings", detail: "Body profile, health history, and preferences", href: "/dashboard/settings", icon: Settings2, keywords: "profile weight height body history bmi account preferences name" },
] as const;

const adminDestinations = [
  { label: "Admin overview", detail: "Platform health and latest activity", href: "/admin", icon: Shield, keywords: "admin platform overview" },
  { label: "User management", detail: "Roles, access, and account status", href: "/admin/users", icon: Users, keywords: "members accounts role status" },
  { label: "Member activity", detail: "Search all member module logs", href: "/admin/activity", icon: Activity, keywords: "logs records super admin all users" },
  { label: "Permissions", detail: "Role matrix and access model", href: "/admin/roles", icon: Shield, keywords: "permissions roles matrix" },
  { label: "Audit logs", detail: "Administrative change history", href: "/admin/audit", icon: FileBarChart, keywords: "audit events admin actions" },
  { label: "System settings", detail: "Service health and broadcast notices", href: "/admin/settings", icon: Settings2, keywords: "system health broadcast notifications firebase" },
] as const;

type RemoteResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  category: string;
};

type CombinedResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  category: string;
  icon: typeof Search;
};

export function CommandSearch({
  isStaff = false,
  isSuperAdmin = false,
}: {
  isStaff?: boolean;
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<RemoteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const localResults = useMemo(() => {
    const source = [
      ...dashboardDestinations,
      ...(isStaff
        ? adminDestinations.filter((item) => item.href !== "/admin/activity" || isSuperAdmin)
        : []),
    ];
    const normalized = query.trim().toLowerCase();
    return source
      .filter(
        (item) =>
          !normalized ||
          `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalized),
      )
      .map((item) => ({
        ...item,
        id: `page-${item.href}`,
        category: "Pages",
      }));
  }, [isStaff, isSuperAdmin, query]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      const clear = setTimeout(() => {
        setRemoteResults([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(clear);
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { results?: RemoteResult[] };
        setRemoteResults(payload.results ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRemoteResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results: CombinedResult[] = useMemo(
    () => [
      ...localResults,
      ...remoteResults.map((item) => ({ ...item, icon: Search })),
    ],
    [localResults, remoteResults],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function openSearch() {
    setActiveIndex(0);
    setOpen(true);
  }

  function visit(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      visit(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="focus-ring group hidden min-w-0 items-center gap-3 rounded-xl border border-black/6 bg-[#fdfbf4]/90 px-3.5 py-2 text-left shadow-[0_5px_16px_rgba(55,45,37,.06)] transition hover:-translate-y-0.5 hover:border-[#5f45e6]/20 sm:flex sm:w-80"
        aria-label="Global search"
      >
        <Search size={15} className="shrink-0 text-[#8c8793] group-hover:text-[#5f45e6]" />
        <span className="min-w-0 flex-1 truncate text-sm text-[#98939e]">
          Search pages and your data
        </span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-black/7 bg-white/75 px-1.5 py-1 text-[10px] font-bold text-[#817c88]">
          <Command size={10} /> K
        </kbd>
      </button>

      <button type="button" onClick={openSearch} className="focus-ring grid size-10 place-items-center rounded-full bg-[#fdfbf4] text-[#676270] shadow-sm sm:hidden" aria-label="Global search">
        <Search size={17} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] flex items-start justify-center bg-[#191621]/45 px-4 pt-[9vh] backdrop-blur-md"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setOpen(false);
                }}
              >
                <motion.section
                  initial={{ opacity: 0, y: -16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Global search"
                  className="w-full max-w-2xl overflow-hidden rounded-[1.4rem] border border-white/70 bg-[#f8f4eb]/95 shadow-[0_35px_100px_rgba(20,15,35,.35)] backdrop-blur-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-black/6 px-5">
                    {loading ? (
                      <LoaderCircle size={20} className="animate-spin text-[#5f45e6]" />
                    ) : (
                      <Search size={20} className="text-[#5f45e6]" />
                    )}
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                      }}
                      onKeyDown={handleKeys}
                      placeholder="Search pages, meals, workouts, groceries, members…"
                      className="h-16 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-[#9b96a1]"
                    />
                    <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-[#918c97] transition hover:bg-black/5" aria-label="Close search">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-[31rem] overflow-y-auto p-2">
                    {results.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => visit(item.href)}
                        className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                          activeIndex === index
                            ? "bg-[#5f45e6] text-white shadow-[0_8px_24px_rgba(95,69,230,.22)]"
                            : "text-[#302b37] hover:bg-white/65"
                        }`}
                      >
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${activeIndex === index ? "bg-white/15" : "bg-[#ebe5fb] text-[#5f45e6]"}`}>
                          <item.icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black">{item.label}</span>
                          <span className={`block truncate text-xs ${activeIndex === index ? "text-white/65" : "text-[#89848f]"}`}>
                            {item.detail}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${activeIndex === index ? "text-white/55" : "text-[#a39eaa]"}`}>
                          {item.category}
                        </span>
                      </button>
                    ))}
                    {!results.length && !loading && (
                      <div className="px-5 py-12 text-center">
                        <p className="font-display text-xl">Nothing found</p>
                        <p className="mt-1 text-sm text-[#8b8691]">
                          Try a page, meal, workout, grocery item, or member name.
                        </p>
                      </div>
                    )}
                  </div>

                  <footer className="flex items-center gap-4 border-t border-black/6 bg-white/30 px-5 py-3 text-[10px] font-bold text-[#918c97]">
                    <span>↑↓ Navigate</span><span>↵ Open</span><span>esc Close</span>
                    <span className="ml-auto">Live results from Supabase</span>
                  </footer>
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
