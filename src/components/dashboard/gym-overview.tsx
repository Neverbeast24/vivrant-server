"use client";

import Link from "next/link";
import {
  ClipboardList,
  Cog,
  Play,
  Sparkles,
  Weight,
} from "lucide-react";
import { GymOverviewStats } from "@/components/dashboard/gym-parts";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Panel, PrimaryButton, Stagger } from "@/components/dashboard/ui";
import { gymSubNav } from "@/lib/nav";

export function GymOverview({
  sessionCount,
  totalMinutes,
  totalCalories,
  machineCount,
  demoCount,
  planCount,
}: {
  sessionCount: number;
  totalMinutes: number;
  totalCalories: number;
  machineCount: number;
  demoCount: number;
  planCount: number;
}) {
  return (
    <>
      <PageHeader eyebrow="GYM" title="Train with" highlight="intention." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        New to the gym? Start with bodyweight demos, then try machines when you feel ready.
      </p>
      <ModuleSubNav items={gymSubNav} />
      <GymOverviewStats
        sessionCount={sessionCount}
        totalMinutes={totalMinutes}
        totalCalories={totalCalories}
        machineCount={machineCount}
      />
      <Stagger>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/dashboard/gym/demos",
              title: "Exercise demos",
              detail: `${demoCount} free-weight & bodyweight clips`,
              icon: Play,
            },
            {
              href: "/dashboard/gym/machines",
              title: "Machines",
              detail: `${machineCount} machine demos + AI picks`,
              icon: Cog,
            },
            {
              href: "/dashboard/gym/sessions",
              title: "Sessions",
              detail: "Log training and review history",
              icon: ClipboardList,
            },
            {
              href: "/dashboard/gym/plans",
              title: "Training plans",
              detail: `${planCount} saved program${planCount === 1 ? "" : "s"}`,
              icon: Sparkles,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              title={card.detail}
              className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-card px-4 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <card.icon size={15} />
              </span>
              <span className="truncate">{card.title}</span>
            </Link>
          ))}
        </div>
      </Stagger>
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
            href="/dashboard/gym/sessions"
            className="inline-flex items-center rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
          >
            Log a short session
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
