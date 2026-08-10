"use client";

import Link from "next/link";
import { Droplets, Moon, Wind } from "lucide-react";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Stagger, StatCard } from "@/components/dashboard/ui";
import { wellnessSubNav } from "@/lib/nav";

function hoursLabel(minutes: number | null) {
  if (minutes == null) return "—";
  const h = minutes / 60;
  return `${h.toFixed(1)}h`;
}

export function WellnessHub({
  lastSleepMinutes,
  waterMl,
  waterGoalMl,
  todayMood,
}: {
  lastSleepMinutes: number | null;
  waterMl: number;
  waterGoalMl: number;
  todayMood: number | null;
}) {
  const waterPct = Math.min(100, Math.round((waterMl / Math.max(waterGoalMl, 1)) * 100));
  const moodLabel = todayMood == null ? "Not logged" : `${todayMood}/5`;

  return (
    <>
      <PageHeader eyebrow="WELLNESS" title="Body signals," highlight="one place." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        Sleep, hydration, and mood all live on your daily check-in — open a card to log or review.
      </p>
      <ModuleSubNav items={wellnessSubNav} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard/sleep" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Sleep"
              value={hoursLabel(lastSleepMinutes)}
              detail="Last night · tap to log"
              icon={Moon}
            />
          </Link>
          <Link href="/dashboard/hydration" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Hydration"
              value={`${Math.round(waterMl / 100) / 10}L`}
              detail={`${waterPct}% of ${(waterGoalMl / 1000).toFixed(1)}L goal`}
              icon={Droplets}
            />
          </Link>
          <Link href="/dashboard/mindfulness" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Mood"
              value={moodLabel}
              detail="Mindfulness check-in"
              icon={Wind}
            />
          </Link>
        </div>
      </Stagger>
    </>
  );
}
