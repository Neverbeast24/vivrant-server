"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import {
  dashboardNav,
  pathMatches,
  sectionActive,
  type NavItem,
} from "@/lib/nav";

export function DashboardNavigation({
  collapsed = false,
  close,
}: {
  collapsed?: boolean;
  close?: () => void;
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const activeParents = useMemo(
    () =>
      dashboardNav
        .filter((item) => item.children?.length && sectionActive(pathname, item))
        .map((item) => item.href),
    [pathname],
  );

  function isOpen(href: string) {
    if (collapsedGroups.includes(href)) return false;
    if (activeParents.includes(href)) return true;
    return expandedGroups.includes(href);
  }

  function toggleGroup(href: string) {
    const currentlyOpen = isOpen(href);
    if (currentlyOpen) {
      setExpandedGroups((current) => current.filter((item) => item !== href));
      setCollapsedGroups((current) =>
        current.includes(href) ? current : [...current, href],
      );
    } else {
      setCollapsedGroups((current) => current.filter((item) => item !== href));
      setExpandedGroups((current) =>
        current.includes(href) ? current : [...current, href],
      );
    }
  }

  return (
    <nav className="space-y-1.5 overflow-y-auto pr-1">
      {dashboardNav.map((item) => (
        <NavGroup
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          open={isOpen(item.href)}
          onToggle={() => toggleGroup(item.href)}
          close={close}
        />
      ))}
    </nav>
  );
}

function NavGroup({
  item,
  pathname,
  collapsed,
  open,
  onToggle,
  close,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  close?: () => void;
}) {
  const active = sectionActive(pathname, item);
  const hasChildren = Boolean(item.children?.length);

  if (!hasChildren) {
    return (
      <Link
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
  }

  return (
    <div>
      <div
        className={`flex items-center rounded-2xl transition ${
          active && !open ? "bg-[#26222f] text-white shadow-[0_10px_24px_rgba(38,34,47,.18)]" : ""
        }`}
      >
        <Link
          href={item.href}
          onClick={close}
          title={collapsed ? item.label : undefined}
          className={`focus-ring group flex min-w-0 flex-1 items-center py-2.5 transition ${
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          } ${active && open ? "text-[#26222f]" : active ? "text-white" : "text-[#4c4757] hover:text-[#26222f]"}`}
        >
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl transition ${
              active && !open
                ? "bg-white/10"
                : active
                  ? "bg-[#ece7fb] text-[#5f45e6]"
                  : "bg-[#eee8dc] group-hover:bg-[#e4ddcf]"
            }`}
          >
            <item.icon size={17} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-black">{item.label}</span>
              <span
                className={`block truncate text-[10px] font-semibold ${
                  active && !open ? "text-white/55" : "text-[#8d8794]"
                }`}
              >
                {item.caption}
              </span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
            className={`mr-2 grid size-8 shrink-0 place-items-center rounded-xl transition ${
              active && !open ? "text-white/80 hover:bg-white/10" : "text-[#8d8794] hover:bg-white"
            }`}
          >
            <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && !collapsed && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1 space-y-1 border-l border-[#26222f]/10 py-1 pl-3">
              {item.children.map((child) => {
                const childActive = pathMatches(pathname, child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={close}
                    className={`block rounded-xl px-3 py-2 transition ${
                      childActive
                        ? "bg-[#ece7fb] text-[#5f45e6]"
                        : "text-[#6b6675] hover:bg-white hover:text-[#26222f]"
                    }`}
                  >
                    <span className="block text-xs font-black">{child.label}</span>
                    {child.caption && (
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#9a95a0]">
                        {child.caption}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
