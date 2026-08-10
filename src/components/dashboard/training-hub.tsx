"use client";

import Link from "next/link";
import {
  ClipboardList,
  Cog,
  Dumbbell,
  Footprints,
  Play,
  Sparkles,
} from "lucide-react";
import { GymOverviewStats } from "@/components/dashboard/gym-parts";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Panel, PrimaryButton, Stagger, StatCard } from "@/components/dashboard/ui";
import { trainingSubNav } from "@/lib/nav";

export function TrainingHub({
  workoutsToday,
  workoutMinutes,
  steps,
  stepGoal,
  sessionCount,
  totalMinutes,
  totalCalories,
  machineCount,
  demoCount,
  planCount,
}: {
  workoutsToday: number;
  workoutMinutes: number;
  steps: number;
  stepGoal: number;
  sessionCount: number;
  totalMinutes: number;
  totalCalories: number;
  machineCount: number;
  demoCount: number;
  planCount: number;
}) {
  const stepPct = Math.min(100, Math.round((steps / Math.max(stepGoal, 1)) * 100));

  return (
    <>
      <PageHeader eyebrow="TRAINING" title="Move and" highlight="train." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        Daily activity and gym work in one place — walks and yoga beside demos, machines, and plans.
      </p>
      <ModuleSubNav items={trainingSubNav} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Workouts today"
            value={String(workoutsToday)}
            detail={workoutMinutes ? `${workoutMinutes} min logged` : "Log a walk or session"}
            icon={Dumbbell}
          />
          <StatCard
            label="Steps"
            value={steps.toLocaleString()}
            detail={`${stepPct}% of ${stepGoal.toLocaleString()} goal`}
            icon={Footprints}
          />
          <StatCard
            label="Gym sessions"
            value={String(sessionCount)}
            detail={totalMinutes ? `${totalMinutes} min · ${totalCalories} kcal` : "No sessions yet"}
            icon={ClipboardList}
          />
        </div>
      </Stagger>

      <Panel
        title="Daily activity"
        className="mt-4"
        right={
          <Link href="/dashboard/movement/log" className="inline-flex">
            <PrimaryButton className="rounded-full px-4 py-2 text-xs">Log workout</PrimaryButton>
          </Link>
        }
      >
        <p className="text-sm leading-6 text-muted">
          Track walks, runs, cycles, yoga, and light strength. AI can suggest one workout from your
          energy and steps.
        </p>
      </Panel>

      <div className="mt-4">
        <GymOverviewStats
          sessionCount={sessionCount}
          totalMinutes={totalMinutes}
          totalCalories={totalCalories}
          machineCount={machineCount}
        />
      </div>

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
    </>
  );
}
