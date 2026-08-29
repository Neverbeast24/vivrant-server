"use client";

import Link from "next/link";
import { Weight } from "lucide-react";
import { GymRecentSessions } from "@/components/dashboard/gym-sessions-list";
import { GymJumpCards, GymOverviewStats } from "@/components/dashboard/gym-parts";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Panel, PrimaryButton } from "@/components/dashboard/ui";
import { trainingSubNav } from "@/lib/nav";
import type { GymSession } from "@/lib/gym";

export function GymOverview({
  sessionCount,
  totalMinutes,
  totalCalories,
  machineCount,
  demoCount,
  planCount,
  sessions = [],
}: {
  sessionCount: number;
  totalMinutes: number;
  totalCalories: number;
  machineCount: number;
  demoCount: number;
  planCount: number;
  sessions?: GymSession[];
}) {
  return (
    <>
      <PageHeader
        eyebrow="TRAINING · GYM"
        title="Train with"
        highlight="intention."
        lede="New to the gym? Start with bodyweight demos, then try machines when you feel ready."
      />
      <ModuleSubNav items={trainingSubNav} />
      <GymOverviewStats
        sessionCount={sessionCount}
        totalMinutes={totalMinutes}
        totalCalories={totalCalories}
        machineCount={machineCount}
      />
      <GymJumpCards
        demoCount={demoCount}
        machineCount={machineCount}
        sessionCount={sessionCount}
        planCount={planCount}
      />
      <GymRecentSessions sessions={sessions} />
      <Panel title="Quick start for beginners" className="mt-4" right={<Weight size={16} className="text-accent" />}>
        <p className="text-sm leading-6 text-muted">
          1) Watch a short beginner demo · 2) Log a light session · 3) Ask AI for machine picks when you
          want a guided circuit.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/gym/demos" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">Watch beginner demos</PrimaryButton>
          </Link>
          <Link
            href="/dashboard/movement/log"
            className="inline-flex items-center rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
          >
            Start today’s workout
          </Link>
          <Link
            href="/dashboard/gym/machines"
            className="inline-flex items-center rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
          >
            Browse machines later
          </Link>
        </div>
      </Panel>
    </>
  );
}
