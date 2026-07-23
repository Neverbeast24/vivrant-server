import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Apple,
  BookOpen,
  BrainCircuit,
  ClipboardList,
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
  Tags,
  Target,
  UserRound,
  WalletCards,
  Weight,
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
    caption: "Meals and macros",
    href: "/dashboard/nutrition",
    children: [
      { label: "Overview", href: "/dashboard/nutrition", caption: "Today’s meals" },
      { label: "Log meal", href: "/dashboard/nutrition/log", caption: "Add food" },
    ],
  },
  {
    icon: Dumbbell,
    label: "Movement",
    caption: "Workouts and activity",
    href: "/dashboard/movement",
    children: [
      { label: "Overview", href: "/dashboard/movement", caption: "Activity pulse" },
      { label: "Log workout", href: "/dashboard/movement/log", caption: "Record a session" },
    ],
  },
  {
    icon: Weight,
    label: "Gym",
    caption: "Demos & machines",
    href: "/dashboard/gym",
    children: [
      { label: "Overview", href: "/dashboard/gym", caption: "Gym home" },
      { label: "Exercise demos", href: "/dashboard/gym/demos", caption: "Free weights & bodyweight" },
      { label: "Machines", href: "/dashboard/gym/machines", caption: "Machine demos & AI picks" },
      { label: "Sessions", href: "/dashboard/gym/sessions", caption: "Log & history" },
      { label: "Training plans", href: "/dashboard/gym/plans", caption: "Saved programs" },
    ],
  },
  {
    icon: Moon,
    label: "Sleep",
    caption: "Rest and recovery",
    href: "/dashboard/sleep",
  },
  {
    icon: Droplets,
    label: "Hydration",
    caption: "Water goals",
    href: "/dashboard/hydration",
  },
  {
    icon: Wind,
    label: "Mindfulness",
    caption: "Mood and calm",
    href: "/dashboard/mindfulness",
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
      { label: "Overview", href: "/dashboard/habits", caption: "Daily habits" },
      { label: "Challenges", href: "/dashboard/habits/challenges", caption: "Weekly targets" },
    ],
  },
  {
    icon: ShoppingBasket,
    label: "Groceries",
    caption: "Smart shopping list",
    href: "/dashboard/groceries",
  },
  {
    icon: Refrigerator,
    label: "Pantry",
    caption: "Stock at a glance",
    href: "/dashboard/pantry",
    children: [
      { label: "Overview", href: "/dashboard/pantry", caption: "Stock pulse" },
      { label: "All items", href: "/dashboard/pantry/items", caption: "Full inventory" },
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
      { label: "Sheet view", href: "/dashboard/spending/sheet", caption: "Excel-style ledger" },
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

export const gymSubNav = [
  { href: "/dashboard/gym", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/gym/demos", label: "Demos", icon: Play },
  { href: "/dashboard/gym/machines", label: "Machines", icon: Cog },
  { href: "/dashboard/gym/sessions", label: "Sessions", icon: ClipboardList },
  { href: "/dashboard/gym/plans", label: "Training plans", icon: Sparkles },
] as const;

export const settingsSubNav = [
  { href: "/dashboard/settings", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings/goals", label: "Goals", icon: Target },
  { href: "/dashboard/settings/history", label: "History", icon: History },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: HeartPulse },
] as const;

export const spendingSubNav = [
  { href: "/dashboard/spending", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/spending/log", label: "Log", icon: WalletCards },
  { href: "/dashboard/spending/sheet", label: "Sheet", icon: FileBarChart },
  { href: "/dashboard/spending/budget", label: "Monthly budget", icon: Target },
] as const;

export const pantrySubNav = [
  { href: "/dashboard/pantry", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pantry/items", label: "Items", icon: Refrigerator },
  { href: "/dashboard/pantry/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/pantry/low-stock", label: "Low stock", icon: AlertTriangle },
  { href: "/dashboard/pantry/add", label: "Add", icon: PackagePlus },
] as const;

export function pathMatches(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/gym") return pathname === "/dashboard/gym";
  if (href === "/dashboard/nutrition") return pathname === "/dashboard/nutrition";
  if (href === "/dashboard/movement") return pathname === "/dashboard/movement";
  if (href === "/dashboard/pantry") return pathname === "/dashboard/pantry";
  if (href === "/dashboard/spending") return pathname === "/dashboard/spending";
  if (href === "/dashboard/ai") return pathname === "/dashboard/ai";
  if (href === "/dashboard/settings") return pathname === "/dashboard/settings";
  if (href === "/dashboard/habits") return pathname === "/dashboard/habits";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function sectionActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((child) => pathMatches(pathname, child.href)) || pathMatches(pathname, item.href);
  }
  return pathMatches(pathname, item.href);
}
