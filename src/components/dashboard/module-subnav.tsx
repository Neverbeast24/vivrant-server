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
                ? "bg-[#14221b] text-white shadow-sm"
                : "bg-[#e8efe9] text-[#52635a] hover:bg-white hover:text-[#14221b]"
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
