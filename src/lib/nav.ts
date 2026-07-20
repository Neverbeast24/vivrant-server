import type { LucideIcon } from "lucide-react";
import {
  Apple,
  BrainCircuit,
  ClipboardList,
  Cog,
  Dumbbell,
  FileBarChart,
  HeartPulse,
  History,
  LayoutDashboard,
  Play,
  Refrigerator,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Target,
  UserRound,
  WalletCards,
  Weight,
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
    caption: "Demos, machines, plans",
    href: "/dashboard/gym",
    children: [
      { label: "Overview", href: "/dashboard/gym", caption: "Gym home" },
      { label: "Exercise demos", href: "/dashboard/gym/demos", caption: "Free weights & bodyweight" },
      { label: "Machines", href: "/dashboard/gym/machines", caption: "Machine demos & AI picks" },
      { label: "Sessions", href: "/dashboard/gym/sessions", caption: "Log & history" },
      { label: "AI plans", href: "/dashboard/gym/plans", caption: "Saved programs" },
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
  },
  {
    icon: WalletCards,
    label: "Spending",
    caption: "Wellness budget",
    href: "/dashboard/spending",
  },
  {
    icon: FileBarChart,
    label: "Reports",
    caption: "Patterns and trends",
    href: "/dashboard/reports",
  },
  {
    icon: BrainCircuit,
    label: "AI Engine",
    caption: "Personal insights",
    href: "/dashboard/ai",
    children: [
      { label: "Ask VIVRΛNT", href: "/dashboard/ai", caption: "Chat coach" },
      { label: "Insights", href: "/dashboard/ai/insights", caption: "Saved recommendations" },
      { label: "Reminders", href: "/dashboard/ai/reminders", caption: "Nudge drafts" },
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
];

export const gymSubNav = [
  { href: "/dashboard/gym", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/gym/demos", label: "Demos", icon: Play },
  { href: "/dashboard/gym/machines", label: "Machines", icon: Cog },
  { href: "/dashboard/gym/sessions", label: "Sessions", icon: ClipboardList },
  { href: "/dashboard/gym/plans", label: "AI plans", icon: Sparkles },
] as const;

export const settingsSubNav = [
  { href: "/dashboard/settings", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings/goals", label: "Goals", icon: Target },
  { href: "/dashboard/settings/history", label: "History", icon: History },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: HeartPulse },
] as const;

export function pathMatches(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/gym") return pathname === "/dashboard/gym";
  if (href === "/dashboard/nutrition") return pathname === "/dashboard/nutrition";
  if (href === "/dashboard/movement") return pathname === "/dashboard/movement";
  if (href === "/dashboard/ai") return pathname === "/dashboard/ai";
  if (href === "/dashboard/settings") return pathname === "/dashboard/settings";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function sectionActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((child) => pathMatches(pathname, child.href)) || pathMatches(pathname, item.href);
  }
  return pathMatches(pathname, item.href);
}
