"use client";

import { useState, useTransition } from "react";
import { Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { coachSleep, logSleep } from "@/app/dashboard/sleep/actions";
import {
  Bars,
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type SleepRow = {
  checkin_date: string;
  sleep_minutes: number | null;
  sleep_quality: number | null;
};

export function SleepView({
  rows,
  avgMinutes,
  lastNight,
}: {
  rows: SleepRow[];
  avgMinutes: number;
  lastNight: number | null;
}) {
  const { pending, submit } = useModuleAction(logSleep);
  const [coachPending, startCoach] = useTransition();
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const chart = rows
    .slice()
    .reverse()
    .map((r) => {
      const hours = Number(r.sleep_minutes ?? 0) / 60;
      return [r.checkin_date.slice(5), Math.min(100, Math.round((hours / 9) * 100))] as [
        string,
        number,
      ];
    });

  return (
    <>
      <PageHeader
        eyebrow="SLEEP"
        title="Rest that"
        highlight="restores."
        action={
          <PrimaryButton
            disabled={coachPending}
            onClick={() =>
              startCoach(async () => {
                const result = await coachSleep();
                if (!result.ok || !("tip" in result) || !result.tip) {
                  toast.error(result.message);
                  return;
                }
                setTip(result.tip);
                toast.success(result.message);
              })
            }
            className="rounded-full"
          >
            {coachPending ? "Coaching…" : "AI bedtime coach"}
          </PrimaryButton>
        }
      />
      <Stagger>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Last night"
            value={lastNight != null ? (lastNight / 60).toFixed(1) : "—"}
            suffix="h"
            detail="From your check-in"
            icon={Moon}
            className="bg-inverse text-inverse-fg"
          />
          <StatCard
            label="7-day average"
            value={avgMinutes ? (avgMinutes / 60).toFixed(1) : "—"}
            suffix="h"
            detail="Aim for 7–9 hours"
            icon={Moon}
          />
          <StatCard
            label="Nights logged"
            value={String(rows.filter((r) => r.sleep_minutes).length)}
            detail="This period"
            icon={Sparkles}
          />
        </div>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Log sleep">
          <form action={submit} className="grid gap-3">
            <FormField label="Date">
              <input name="checkin_date" type="date" defaultValue={today} className={fieldClass} />
            </FormField>
            <FormField label="Hours slept">
              <input
                name="sleep_hours"
                type="number"
                min={0}
                max={24}
                step="0.1"
                required
                defaultValue={7}
                className={fieldClass}
              />
            </FormField>
            <FormField label="Quality (1–5)" hint="optional">
              <input name="sleep_quality" type="number" min={1} max={5} className={fieldClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bedtime">
                <input name="bedtime" type="time" className={fieldClass} />
              </FormField>
              <FormField label="Wake">
                <input name="wake_time" type="time" className={fieldClass} />
              </FormField>
            </div>
            <PrimaryButton disabled={pending}>{pending ? "Saving…" : "Save sleep"}</PrimaryButton>
          </form>
        </Panel>

        <Panel title="Recent nights">
          {chart.length ? <Bars data={chart} /> : (
            <EmptyState>
              No sleep logged yet. Enter last night’s hours on the left — aim for 7–9 hours when you can.
            </EmptyState>
          )}
          {tip && (
            <div className="mt-4 rounded-2xl border border-ink/8 bg-surface/60 p-4">
              <p className="text-sm font-black">{tip.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{tip.body}</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
