"use client";

import { Droplets, Bell } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { addHydration, scheduleHydrationReminders } from "@/app/dashboard/hydration/actions";
import {
  EmptyState,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

export function HydrationView({
  waterMl,
  goalMl,
  weekRows,
}: {
  waterMl: number;
  goalMl: number;
  weekRows: { checkin_date: string; water_ml: number | null }[];
}) {
  const { pending, submit } = useModuleAction(addHydration);
  const [remPending, startRem] = useTransition();
  const pct = Math.min(100, Math.round((waterMl / Math.max(goalMl, 1)) * 100));
  const daysHit = weekRows.filter((r) => Number(r.water_ml ?? 0) >= goalMl).length;

  function quick(amount: number) {
    const fd = new FormData();
    fd.set("amount_ml", String(amount));
    submit(fd);
  }

  return (
    <>
      <PageHeader
        eyebrow="HYDRATION"
        title="Sip with"
        highlight="intention."
        action={
          <PrimaryButton
            disabled={remPending}
            onClick={() =>
              startRem(async () => {
                const result = await scheduleHydrationReminders();
                if (result.ok) toast.success(result.message);
                else toast.error(result.message);
              })
            }
            className="rounded-full"
          >
            <Bell size={14} className="mr-1.5 inline" />
            {remPending ? "Scheduling…" : "Water reminders"}
          </PrimaryButton>
        }
      />
      <Stagger>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Today"
            value={(waterMl / 1000).toFixed(1)}
            suffix="L"
            detail={`${pct}% of ${(goalMl / 1000).toFixed(1)}L goal`}
            icon={Droplets}
            className="bg-inverse text-inverse-fg"
          />
          <StatCard
            label="Goal days"
            value={String(daysHit)}
            detail="Last 7 days at goal"
            icon={Droplets}
          />
          <StatCard
            label="Progress"
            value={`${pct}`}
            suffix="%"
            detail="Keep the bottle close"
            icon={Droplets}
          />
        </div>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Quick add">
          <div className="mb-4">
            <Progress value={pct} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[250, 500, 750].map((ml) => (
              <PrimaryButton
                key={ml}
                type="button"
                disabled={pending}
                onClick={() => quick(ml)}
                className="rounded-full"
              >
                +{ml} ml
              </PrimaryButton>
            ))}
          </div>
        </Panel>
        <Panel title="This week">
          <ul className="space-y-2">
            {weekRows.map((row) => (
              <li
                key={row.checkin_date}
                className="flex items-center justify-between rounded-xl border border-ink/6 px-3 py-2 text-sm"
              >
                <span className="font-semibold">{row.checkin_date}</span>
                <span className="text-muted">
                  {((row.water_ml ?? 0) / 1000).toFixed(1)} L
                </span>
              </li>
            ))}
            {!weekRows.length && <EmptyState>No hydration logged yet.</EmptyState>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
