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
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathMatches(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
              active
                ? "bg-[#26222f] text-white shadow-sm"
                : "bg-[#f4efe4] text-[#6b6675] hover:bg-white hover:text-[#26222f]"
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
