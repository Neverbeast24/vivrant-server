"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Apple,
  BrainCircuit,
  Command,
  Dumbbell,
  FileBarChart,
  LayoutDashboard,
  Refrigerator,
  Search,
  Settings2,
  ShoppingBasket,
  WalletCards,
  X,
} from "lucide-react";

const destinations = [
  {
    label: "Today",
    detail: "Daily health overview and quick check-in",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: "home overview mood energy water steps",
  },
  {
    label: "Nutrition",
    detail: "Log meals, calories, and protein",
    href: "/dashboard/nutrition",
    icon: Apple,
    keywords: "food meal calorie protein diet",
  },
  {
    label: "Movement",
    detail: "Record workouts and activity",
    href: "/dashboard/movement",
    icon: Dumbbell,
    keywords: "exercise workout calories minutes steps",
  },
  {
    label: "Groceries",
    detail: "Manage your shopping list",
    href: "/dashboard/groceries",
    icon: ShoppingBasket,
    keywords: "shopping food list buy",
  },
  {
    label: "Pantry",
    detail: "Track food and expiry dates",
    href: "/dashboard/pantry",
    icon: Refrigerator,
    keywords: "inventory expiry kitchen stock",
  },
  {
    label: "Spending",
    detail: "Review health and grocery expenses",
    href: "/dashboard/spending",
    icon: WalletCards,
    keywords: "money expense budget cost",
  },
  {
    label: "Reports",
    detail: "See trends across your wellbeing",
    href: "/dashboard/reports",
    icon: FileBarChart,
    keywords: "analytics trends weekly data",
  },
  {
    label: "AI Engine",
    detail: "Ask VIVA about your health data",
    href: "/dashboard/ai",
    icon: BrainCircuit,
    keywords: "assistant insight ask recommendation",
  },
  {
    label: "Settings",
    detail: "Profile, preferences, and account",
    href: "/dashboard/settings",
    icon: Settings2,
    keywords: "profile account preferences name",
  },
];

export function CommandSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // true on the client after hydration, false during SSR — needed for the portal.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return destinations;
    return destinations.filter((item) =>
      `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalized),
    );
  }, [query]);

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
        className="focus-ring group hidden min-w-0 items-center gap-3 rounded-xl border border-black/6 bg-[#fdfbf4]/90 px-3.5 py-2 text-left shadow-[0_5px_16px_rgba(55,45,37,.06)] transition hover:-translate-y-0.5 hover:border-[#5f45e6]/20 hover:shadow-[0_8px_22px_rgba(55,45,37,.1)] sm:flex sm:w-72"
        aria-label="Search VIVA"
      >
        <Search size={15} className="shrink-0 text-[#8c8793] group-hover:text-[#5f45e6]" />
        <span className="min-w-0 flex-1 truncate text-sm text-[#98939e]">
          Search VIVA
        </span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-black/7 bg-white/75 px-1.5 py-1 text-[10px] font-bold text-[#817c88] shadow-sm">
          <Command size={10} /> K
        </kbd>
      </button>

      <button
        type="button"
        onClick={openSearch}
        className="focus-ring grid size-10 place-items-center rounded-full bg-[#fdfbf4] text-[#676270] shadow-sm sm:hidden"
        aria-label="Search VIVA"
      >
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
            className="fixed inset-0 z-[999] flex items-start justify-center bg-[#191621]/45 px-4 pt-[12vh] backdrop-blur-md"
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
              aria-label="Search VIVA"
              className="w-full max-w-2xl overflow-hidden rounded-[1.4rem] border border-white/70 bg-[#f8f4eb]/95 shadow-[0_35px_100px_rgba(20,15,35,.35)] backdrop-blur-2xl"
            >
              <div className="flex h-11 items-center border-b border-black/6 bg-white/35 px-4">
                <div className="flex gap-2" aria-hidden>
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="mx-auto pl-12 text-xs font-bold text-[#8b8691]">
                  VIVA Search
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-black/6 px-5">
                <Search size={20} className="shrink-0 text-[#5f45e6]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeys}
                  placeholder="Search pages, tools, and health features…"
                  className="h-16 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#2b2732] outline-none placeholder:font-normal placeholder:text-[#9b96a1]"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[#918c97] transition hover:bg-black/5 hover:text-[#302b37]"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[24rem] overflow-y-auto p-2">
                {results.map((item, index) => (
                  <button
                    key={item.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => visit(item.href)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      activeIndex === index
                        ? "bg-[#5f45e6] text-white shadow-[0_8px_24px_rgba(95,69,230,.22)]"
                        : "text-[#302b37] hover:bg-white/65"
                    }`}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                        activeIndex === index ? "bg-white/15" : "bg-[#ebe5fb] text-[#5f45e6]"
                      }`}
                    >
                      <item.icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">{item.label}</span>
                      <span
                        className={`block truncate text-xs ${
                          activeIndex === index ? "text-white/65" : "text-[#89848f]"
                        }`}
                      >
                        {item.detail}
                      </span>
                    </span>
                    <span className={`text-xs ${activeIndex === index ? "text-white/60" : "text-[#aaa5af]"}`}>
                      ↵
                    </span>
                  </button>
                ))}
                {!results.length && (
                  <div className="px-5 py-12 text-center">
                    <p className="font-display text-xl">Nothing found</p>
                    <p className="mt-1 text-sm text-[#8b8691]">
                      Try nutrition, reports, settings, or groceries.
                    </p>
                  </div>
                )}
              </div>

              <footer className="flex items-center gap-4 border-t border-black/6 bg-white/30 px-5 py-3 text-[10px] font-bold text-[#918c97]">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>esc Close</span>
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
