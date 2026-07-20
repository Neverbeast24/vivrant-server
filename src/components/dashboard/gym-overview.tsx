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
      <ModuleSubNav items={gymSubNav} />
      <GymOverviewStats
        sessionCount={sessionCount}
        totalMinutes={totalMinutes}
        totalCalories={totalCalories}
        machineCount={machineCount}
      />
      <Stagger>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              title: "AI plans",
              detail: `${planCount} saved program${planCount === 1 ? "" : "s"}`,
              icon: Sparkles,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[1.4rem] border border-[#14221b]/8 bg-[#f6faf7] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0e7c66]/25 hover:shadow-md"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-[#d7efe6] text-[#0e7c66]">
                <card.icon size={18} />
              </span>
              <p className="mt-4 text-sm font-black">{card.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#6a7a71]">{card.detail}</p>
            </Link>
          ))}
        </div>
      </Stagger>
      <Panel title="Quick start" className="mt-4" right={<Weight size={16} className="text-[#0e7c66]" />}>
        <p className="text-sm leading-6 text-[#55665d]">
          Pick a machine circuit, watch a short demo, then log the session. Use AI picks when you want a
          guided machine list matched to your profile.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/gym/machines">
            <PrimaryButton className="rounded-full px-5">Browse machines</PrimaryButton>
          </Link>
          <Link
            href="/dashboard/gym/sessions"
            className="inline-flex items-center rounded-full border border-[#14221b]/12 bg-white/70 px-5 py-3 text-xs font-black text-[#3d4a42] transition hover:border-[#0e7c66]/30 hover:text-[#0e7c66]"
          >
            Log a session
          </Link>
        </div>
      </Panel>
    </>
  );
}
