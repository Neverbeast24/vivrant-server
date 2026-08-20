import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Archive,
  BookOpen,
  ClipboardList,
  BrainCircuit,
  Cog,
  Droplets,
  Dumbbell,
  FileBarChart,
  Flame,
  HeartPulse,
  History,
  LayoutDashboard,
  LifeBuoy,
  Moon,
  PackagePlus,
  Play,
  Refrigerator,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Target,
  UserRound,
  WalletCards,
  Wind,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  caption?: string;
};

export type NavItem = {
  icon: LucideIcon;
  label: string;
  caption: string;
  href: string;
  children?: NavChild[];
};

export const dashboardNav: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Today",
    caption: "Your daily rhythm",
    href: "/dashboard",
  },
  {
    icon: Apple,
    label: "Nutrition",
    caption: "Meals and calories",
    href: "/dashboard/nutrition",
    children: [
      { label: "Overview", href: "/dashboard/nutrition", caption: "Today’s meals" },
      { label: "Log meal", href: "/dashboard/nutrition/log", caption: "Add or suggest" },
      { label: "Sheet view", href: "/dashboard/nutrition/sheet", caption: "Excel-style log" },
    ],
  },
  {
    icon: Dumbbell,
    label: "Training",
    caption: "Activity and gym",
    href: "/dashboard/training",
    children: [
      { label: "Overview", href: "/dashboard/training", caption: "Daily activity & gym" },
      { label: "Log workout", href: "/dashboard/movement/log", caption: "Today’s program or a walk" },
      { label: "Program", href: "/dashboard/gym/plans", caption: "Saved AI programs" },
      { label: "Demos", href: "/dashboard/gym/demos", caption: "Form videos" },
      { label: "Machines", href: "/dashboard/gym/machines", caption: "Equipment guides" },
      { label: "Gym", href: "/dashboard/gym", caption: "Training hub" },
    ],
  },
  {
    icon: HeartPulse,
    label: "Wellness",
    caption: "Sleep, water, mood",
    href: "/dashboard/wellness",
    children: [
      { label: "Overview", href: "/dashboard/wellness", caption: "Daily body signals" },
      { label: "Sleep", href: "/dashboard/sleep", caption: "Rest and recovery" },
      { label: "Hydration", href: "/dashboard/hydration", caption: "Water goals" },
      { label: "Mindfulness", href: "/dashboard/mindfulness", caption: "Mood and calm" },
    ],
  },
  {
    icon: BookOpen,
    label: "Journal",
    caption: "Notes and reflection",
    href: "/dashboard/journal",
  },
  {
    icon: Flame,
    label: "Habits",
    caption: "Streaks and challenges",
    href: "/dashboard/habits",
    children: [
      { label: "Overview", href: "/dashboard/habits", caption: "Daily checkboxes" },
      { label: "Add habit", href: "/dashboard/habits/add", caption: "Start a new streak" },
      { label: "Challenges", href: "/dashboard/habits/challenges", caption: "Weekly targets" },
    ],
  },
  {
    icon: Refrigerator,
    label: "Kitchen",
    caption: "Shopping and stock",
    href: "/dashboard/kitchen",
    children: [
      { label: "Overview", href: "/dashboard/kitchen", caption: "List + pantry pulse" },
      { label: "Shopping", href: "/dashboard/groceries", caption: "Your grocery list" },
      { label: "Add groceries", href: "/dashboard/groceries/add", caption: "Form or paste a list" },
      { label: "Sheet view", href: "/dashboard/groceries/sheet", caption: "Excel-style list" },
      { label: "Meal plan", href: "/dashboard/groceries/plan", caption: "AI list from meals" },
      { label: "Prices", href: "/dashboard/groceries/insights", caption: "Budget and PH trends" },
      { label: "Pantry", href: "/dashboard/pantry", caption: "Stock at a glance" },
      { label: "All items", href: "/dashboard/pantry/items", caption: "Full inventory" },
      { label: "Pantry sheet", href: "/dashboard/pantry/sheet", caption: "Excel-style stock" },
      { label: "Categories", href: "/dashboard/pantry/categories", caption: "Browse by type" },
      { label: "Low stock", href: "/dashboard/pantry/low-stock", caption: "Needs restock" },
      { label: "Add item", href: "/dashboard/pantry/add", caption: "Log new stock" },
    ],
  },
  {
    icon: WalletCards,
    label: "Spending",
    caption: "Monthly budget",
    href: "/dashboard/spending",
    children: [
      { label: "Overview", href: "/dashboard/spending", caption: "This month" },
      { label: "Log expense", href: "/dashboard/spending/log", caption: "Add a purchase" },
      { label: "Sheet view", href: "/dashboard/spending/sheet", caption: "Expense table" },
      { label: "Monthly budget", href: "/dashboard/spending/budget", caption: "Edit monthly amount" },
    ],
  },
  {
    icon: FileBarChart,
    label: "Reports",
    caption: "Patterns and trends",
    href: "/dashboard/reports",
  },
  {
    icon: BrainCircuit,
    label: "Ask VIVRΛNT",
    caption: "Chat coach & reminders",
    href: "/dashboard/ai",
    children: [
      { label: "Ask VIVRΛNT", href: "/dashboard/ai", caption: "Chat coach" },
      { label: "Insights", href: "/dashboard/ai/insights", caption: "Saved recommendations" },
      { label: "Reminders", href: "/dashboard/ai/reminders", caption: "Scheduled nudges" },
    ],
  },
  {
    icon: Settings2,
    label: "Profile",
    caption: "Body, goals, preferences",
    href: "/dashboard/settings",
    children: [
      { label: "Health profile", href: "/dashboard/settings", caption: "Avatar & body stats" },
      { label: "Goals", href: "/dashboard/settings/goals", caption: "Targets" },
      { label: "Health history", href: "/dashboard/settings/history", caption: "Measurements" },
      { label: "Activity", href: "/dashboard/activity", caption: "Change history" },
      { label: "Archived", href: "/dashboard/archive", caption: "Restore deleted items" },
      { label: "Preferences", href: "/dashboard/settings/preferences", caption: "App settings" },
    ],
  },
  {
    icon: LifeBuoy,
    label: "Help",
    caption: "Questions & bug reports",
    href: "/dashboard/support",
  },
];

/** Shared sub-nav for Training (daily activity + gym). */
export const trainingSubNav = [
  { href: "/dashboard/training", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/movement/log", label: "Log workout", icon: Dumbbell },
  { href: "/dashboard/gym/demos", label: "Demos", icon: Play },
  { href: "/dashboard/gym/machines", label: "Machines", icon: Cog },
  { href: "/dashboard/gym/plans", label: "Program", icon: Sparkles },
] as const;

/** @deprecated Use trainingSubNav */
export const gymSubNav = trainingSubNav;

export const wellnessSubNav = [
  { href: "/dashboard/wellness", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sleep", label: "Sleep", icon: Moon },
  { href: "/dashboard/hydration", label: "Hydration", icon: Droplets },
  { href: "/dashboard/mindfulness", label: "Mindfulness", icon: Wind },
] as const;

export const kitchenSubNav = [
  { href: "/dashboard/kitchen", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/groceries", label: "Shopping", icon: ShoppingBasket },
  { href: "/dashboard/groceries/sheet", label: "Sheet", icon: FileBarChart },
  { href: "/dashboard/pantry", label: "Pantry", icon: Refrigerator },
  { href: "/dashboard/pantry/add", label: "Add", icon: PackagePlus },
] as const;

/** @deprecated Use kitchenSubNav */
export const pantrySubNav = kitchenSubNav;

export const settingsSubNav = [
  { href: "/dashboard/settings", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings/goals", label: "Goals", icon: Target },
  { href: "/dashboard/settings/history", label: "History", icon: History },
  { href: "/dashboard/activity", label: "Activity", icon: ClipboardList },
  { href: "/dashboard/archive", label: "Archived", icon: Archive },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: HeartPulse },
] as const;

export const spendingSubNav = [
  { href: "/dashboard/spending", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/spending/log", label: "Log", icon: WalletCards },
  { href: "/dashboard/spending/sheet", label: "Sheet", icon: FileBarChart },
  { href: "/dashboard/spending/budget", label: "Monthly budget", icon: Target },
] as const;

const sectionRoots: Record<string, string[]> = {
  "/dashboard/training": ["/dashboard/training", "/dashboard/movement", "/dashboard/gym"],
  "/dashboard/wellness": [
    "/dashboard/wellness",
    "/dashboard/sleep",
    "/dashboard/hydration",
    "/dashboard/mindfulness",
  ],
  "/dashboard/kitchen": ["/dashboard/kitchen", "/dashboard/groceries", "/dashboard/pantry"],
};

export function pathMatches(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/nutrition") return pathname === "/dashboard/nutrition";
  if (href === "/dashboard/training") return pathname === "/dashboard/training";
  if (href === "/dashboard/wellness") return pathname === "/dashboard/wellness";
  if (href === "/dashboard/kitchen") return pathname === "/dashboard/kitchen";
  if (href === "/dashboard/gym") return pathname === "/dashboard/gym";
  if (href === "/dashboard/groceries") {
    return (
      pathname === "/dashboard/groceries" ||
      pathname.startsWith("/dashboard/groceries/add") ||
      pathname.startsWith("/dashboard/groceries/plan") ||
      pathname.startsWith("/dashboard/groceries/insights")
    );
  }
  if (href === "/dashboard/pantry") return pathname === "/dashboard/pantry";
  if (href === "/dashboard/spending") return pathname === "/dashboard/spending";
  if (href === "/dashboard/ai") return pathname === "/dashboard/ai";
  if (href === "/dashboard/settings") return pathname === "/dashboard/settings";
  if (href === "/dashboard/habits") {
    return pathname === "/dashboard/habits" || pathname.startsWith("/dashboard/habits/add");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionContains(pathname: string, root: string) {
  const roots = sectionRoots[root] ?? [root];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function sectionActive(pathname: string, item: NavItem) {
  if (item.href === "/dashboard/training" || item.href === "/dashboard/wellness" || item.href === "/dashboard/kitchen") {
    return sectionContains(pathname, item.href);
  }
  if (item.children?.length) {
    return item.children.some((child) => pathMatches(pathname, child.href)) || pathMatches(pathname, item.href);
  }
  return pathMatches(pathname, item.href);
}
