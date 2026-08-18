"use client";

import Link from "next/link";
import type { WellnessPulse } from "@/app/dashboard/wellness/types";

function hoursLabel(minutes: number | null) {
  if (minutes == null) return "—";
  return `${(minutes / 60).toFixed(1)}h`;
}

export function WellnessPulseBar({
  pulse,
  current,
}: {
  pulse: WellnessPulse;
  current?: "sleep" | "hydration" | "mindfulness";
}) {
  const items = [
    {
      key: "sleep" as const,
      href: "/dashboard/sleep",
      label: "Sleep",
      value: hoursLabel(pulse.sleepMinutes),
    },
    {
      key: "hydration" as const,
      href: "/dashboard/hydration",
      label: "Water",
      value: `${(pulse.waterMl / 1000).toFixed(1)}L`,
    },
    {
      key: "mindfulness" as const,
      href: "/dashboard/mindfulness",
      label: "Mood",
      value: pulse.mood == null ? "—" : `${pulse.mood}/5`,
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-2xl border px-3 py-2.5 text-center transition ${
            current === item.key
              ? "border-accent/35 bg-accent-soft"
              : "border-ink/8 bg-card hover:border-accent/25"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-muted">{item.label}</p>
          <p className="mt-0.5 text-sm font-black">{item.value}</p>
        </Link>
      ))}
    </div>
  );
}
