"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Apple,
  BookOpen,
  BrainCircuit,
  Command,
  Droplets,
  Dumbbell,
  FileBarChart,
  Flame,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  Moon,
  Refrigerator,
  Search,
  Settings2,
  Shield,
  ShoppingBasket,
  Users,
  WalletCards,
  Weight,
  Wind,
  X,
} from "lucide-react";

const dashboardDestinations = [
  { label: "Today", detail: "Daily health overview and quick check-in", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview mood energy water steps" },
  { label: "Nutrition", detail: "Meal overview and macros", href: "/dashboard/nutrition", icon: Apple, keywords: "food meal calorie protein diet" },
  { label: "Log meal", detail: "Add a meal with AI estimate", href: "/dashboard/nutrition/log", icon: Apple, keywords: "log food meal" },
  { label: "Movement", detail: "Activity overview", href: "/dashboard/movement", icon: Dumbbell, keywords: "exercise workout calories minutes steps" },
  { label: "Log workout", detail: "Record a movement session", href: "/dashboard/movement/log", icon: Dumbbell, keywords: "log workout" },
  { label: "Gym", detail: "Gym home and quick links", href: "/dashboard/gym", icon: Weight, keywords: "gym overview" },
  { label: "Gym demos", detail: "Free-weight and bodyweight videos", href: "/dashboard/gym/demos", icon: Weight, keywords: "demo video form" },
  { label: "Gym machines", detail: "Machine demos and AI picks", href: "/dashboard/gym/machines", icon: Weight, keywords: "machine cable cardio equipment" },
  { label: "Gym sessions", detail: "Log and review gym training", href: "/dashboard/gym/sessions", icon: Weight, keywords: "session log history" },
  { label: "Gym plans", detail: "AI training programs", href: "/dashboard/gym/plans", icon: Weight, keywords: "plan program ai" },
  { label: "Sleep", detail: "Rest tracking and bedtime coach", href: "/dashboard/sleep", icon: Moon, keywords: "sleep rest recovery bedtime" },
  { label: "Hydration", detail: "Water intake and reminders", href: "/dashboard/hydration", icon: Droplets, keywords: "water drink hydration bottle" },
  { label: "Mindfulness", detail: "Mood check-ins and calm tips", href: "/dashboard/mindfulness", icon: Wind, keywords: "mood calm stress breathe" },
  { label: "Journal", detail: "Notes and weekly reflection", href: "/dashboard/journal", icon: BookOpen, keywords: "journal notes diary reflect" },
  { label: "Habits", detail: "Daily streaks and checkboxes", href: "/dashboard/habits", icon: Flame, keywords: "habit streak routine" },
  { label: "Challenges", detail: "Weekly personal targets", href: "/dashboard/habits/challenges", icon: Flame, keywords: "challenge weekly goal gamification" },
  { label: "Groceries", detail: "Manage your shopping list", href: "/dashboard/groceries", icon: ShoppingBasket, keywords: "shopping food list buy" },
  { label: "Pantry", detail: "Stock overview", href: "/dashboard/pantry", icon: Refrigerator, keywords: "inventory kitchen stock" },
  { label: "Pantry items", detail: "Full inventory and stock levels", href: "/dashboard/pantry/items", icon: Refrigerator, keywords: "pantry inventory items" },
  { label: "Pantry categories", detail: "Browse stock by food type", href: "/dashboard/pantry/categories", icon: Refrigerator, keywords: "pantry category vegetables grains" },
  { label: "Low stock", detail: "Items that need restocking", href: "/dashboard/pantry/low-stock", icon: Refrigerator, keywords: "pantry low restock empty" },
  { label: "Add pantry item", detail: "Log something new on the shelf", href: "/dashboard/pantry/add", icon: Refrigerator, keywords: "pantry add stock" },
  { label: "Spending", detail: "Review health and grocery expenses", href: "/dashboard/spending", icon: WalletCards, keywords: "money expense budget cost" },
  { label: "Log expense", detail: "Add a wellness or grocery purchase", href: "/dashboard/spending/log", icon: WalletCards, keywords: "add expense log purchase" },
  { label: "Spending sheet", detail: "Excel-style ledger of expenses", href: "/dashboard/spending/sheet", icon: WalletCards, keywords: "excel sheet ledger table edit" },
  { label: "Monthly budget", detail: "Set or edit monthly spending budget", href: "/dashboard/spending/budget", icon: WalletCards, keywords: "budget money monthly allowance" },
  { label: "Reports", detail: "See trends across your wellbeing", href: "/dashboard/reports", icon: FileBarChart, keywords: "analytics trends weekly data" },
  { label: "Ask VIVRΛNT", detail: "Chat with your health coach", href: "/dashboard/ai", icon: BrainCircuit, keywords: "assistant ask chat" },
  { label: "AI insights", detail: "Saved recommendations", href: "/dashboard/ai/insights", icon: BrainCircuit, keywords: "insight recommendation" },
  { label: "AI reminders", detail: "Scheduled nudges and gym schedule", href: "/dashboard/ai/reminders", icon: BrainCircuit, keywords: "reminder notification gym plan schedule" },
  { label: "Health profile", detail: "Avatar and body stats", href: "/dashboard/settings", icon: Settings2, keywords: "profile weight height bmi avatar" },
  { label: "Goals", detail: "Health targets", href: "/dashboard/settings/goals", icon: Settings2, keywords: "goals targets" },
  { label: "Health history", detail: "Body measurements over time", href: "/dashboard/settings/history", icon: Settings2, keywords: "history measurements weight" },
  { label: "Preferences", detail: "Theme and notifications", href: "/dashboard/settings/preferences", icon: Settings2, keywords: "settings theme timezone" },
  { label: "Support / Help", detail: "Questions and bug reports", href: "/dashboard/support", icon: LifeBuoy, keywords: "bug ticket help feedback report issue support" },
] as const;

const adminDestinations = [
  { label: "Admin overview", detail: "Platform health and latest activity", href: "/admin", icon: Shield, keywords: "admin platform overview" },
  { label: "User management", detail: "Roles, access, and account status", href: "/admin/users", icon: Users, keywords: "members accounts role status" },
  { label: "Support tickets", detail: "Review member bugs and requests", href: "/admin/tickets", icon: LifeBuoy, keywords: "tickets bugs support inbox" },
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
        className="focus-ring group hidden min-w-0 items-center gap-3 rounded-xl border border-ink/6 bg-card/90 px-3.5 py-2 text-left shadow-[0_5px_16px_rgba(55,45,37,.06)] transition hover:-translate-y-0.5 hover:border-accent/20 sm:flex sm:w-80"
        aria-label="Global search"
      >
        <Search size={15} className="shrink-0 text-muted group-hover:text-accent" />
        <span className="min-w-0 flex-1 truncate text-sm text-muted">
          Search pages and your data
        </span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-ink/7 bg-panel/75 px-1.5 py-1 text-[10px] font-bold text-muted">
          <Command size={10} /> K
        </kbd>
      </button>

      <button type="button" onClick={openSearch} className="focus-ring grid size-10 place-items-center rounded-full bg-card text-muted shadow-sm sm:hidden" aria-label="Global search">
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
                className="fixed inset-0 z-[999] flex items-start justify-center bg-solid/45 px-4 pt-[9vh] backdrop-blur-md"
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
                  className="w-full max-w-2xl overflow-hidden rounded-[1.4rem] border border-panel/70 bg-card/95 shadow-[0_35px_100px_rgba(20,15,35,.35)] backdrop-blur-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-ink/6 px-5">
                    {loading ? (
                      <LoaderCircle size={20} className="animate-spin text-accent" />
                    ) : (
                      <Search size={20} className="text-accent" />
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
                      className="h-16 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted"
                    />
                    <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ink/8" aria-label="Close search">
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
                            ? "bg-accent text-white shadow-[0_8px_24px_rgba(14,124,102,.22)]"
                            : "text-ink hover:bg-panel/65"
                        }`}
                      >
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${activeIndex === index ? "bg-panel/15" : "bg-accent-soft text-accent"}`}>
                          <item.icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black">{item.label}</span>
                          <span className={`block truncate text-xs ${activeIndex === index ? "text-white/65" : "text-muted"}`}>
                            {item.detail}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${activeIndex === index ? "text-white/55" : "text-muted"}`}>
                          {item.category}
                        </span>
                      </button>
                    ))}
                    {!results.length && !loading && (
                      <div className="px-5 py-12 text-center">
                        <p className="font-display text-xl">Nothing found</p>
                        <p className="mt-1 text-sm text-muted">
                          Try a page, meal, workout, grocery item, or member name.
                        </p>
                      </div>
                    )}
                  </div>

                  <footer className="flex items-center gap-4 border-t border-ink/6 bg-panel/30 px-5 py-3 text-[10px] font-bold text-muted">
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
