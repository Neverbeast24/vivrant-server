"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { pathMatches } from "@/lib/nav";

export function ModuleSubNav({
  items,
}: {
  items: readonly { href: string; label: string; icon?: LucideIcon }[];
}) {
  const pathname = usePathname();

  return (
    <div className="chip-track mb-8">
      {items.map((item) => {
        const active = pathMatches(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
              active
                ? "bg-inverse text-inverse-fg shadow-[0_8px_18px_rgba(var(--shadow-color),.16)]"
                : "text-ink/75 hover:bg-card hover:text-ink"
            }`}
          >
            {item.icon && <item.icon size={13} />}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
