"use client";

import Link from "next/link";
import { ClipboardList, Dumbbell, Footprints } from "lucide-react";
import { GymJumpCards, GymOverviewStats } from "@/components/dashboard/gym-parts";
import { ProgramSessionPanel } from "@/components/dashboard/program-session";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Panel, PrimaryButton, Stagger, StatCard } from "@/components/dashboard/ui";
import { trainingSubNav } from "@/lib/nav";
import type { GymPlan } from "@/lib/gym";

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
  plans = [],
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
  plans?: GymPlan[];
}) {
  const stepPct = Math.min(100, Math.round((steps / Math.max(stepGoal, 1)) * 100));

  return (
    <>
      <PageHeader eyebrow="TRAINING" title="Move and" highlight="train." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        Daily activity and gym work in one place — create a program, then log today’s session with checkboxes and rest timers.
      </p>
      <ModuleSubNav items={trainingSubNav} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Workouts today"
            value={String(workoutsToday)}
            detail={workoutMinutes ? `${workoutMinutes} min logged` : "Today’s program or a walk"}
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

      <div className="mt-4">
        <ProgramSessionPanel plans={plans} compact />
      </div>

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
          Track walks, runs, and today’s gym program. Check off sets and rest between them, or log a
          simple walk.
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

      <GymJumpCards
        demoCount={demoCount}
        machineCount={machineCount}
        sessionCount={sessionCount}
        planCount={planCount}
      />
    </>
  );
}
