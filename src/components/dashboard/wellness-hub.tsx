"use client";

import { useState } from "react";
import Link from "next/link";
import { Droplets, Moon, Wind } from "lucide-react";
import { addHydration } from "@/app/dashboard/hydration/actions";
import { logMood } from "@/app/dashboard/journal/actions";
import { logSleep } from "@/app/dashboard/sleep/actions";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { WellnessPulseBar } from "@/components/dashboard/wellness-pulse";
import {
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { wellnessSubNav } from "@/lib/nav";
import type { WellnessPulse } from "@/app/dashboard/wellness/types";

function hoursLabel(minutes: number | null) {
  if (minutes == null) return "—";
  const h = minutes / 60;
  return `${h.toFixed(1)}h`;
}

const moods = [
  ["1", "😔"],
  ["2", "🙁"],
  ["3", "😐"],
  ["4", "🙂"],
  ["5", "😄"],
] as const;

export function WellnessHub({ pulse }: { pulse: WellnessPulse }) {
  const sleepAction = useModuleAction(logSleep);
  const waterAction = useModuleAction(addHydration);
  const moodAction = useModuleAction(logMood);
  const [mood, setMood] = useState(String(pulse.mood ?? "4"));
  const waterPct = Math.min(100, Math.round((pulse.waterMl / Math.max(pulse.waterGoalMl, 1)) * 100));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="WELLNESS"
        title="Body signals,"
        highlight="one place."
        lede="Sleep, water, and mood share one daily check-in. Log them here, or open a card for the full history."
      />
      <ModuleSubNav items={wellnessSubNav} />
      <WellnessPulseBar pulse={pulse} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard/sleep" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Sleep"
              value={hoursLabel(pulse.sleepMinutes)}
              detail="Last night · tap for history"
              icon={Moon}
            />
          </Link>
          <Link href="/dashboard/hydration" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Hydration"
              value={`${Math.round(pulse.waterMl / 100) / 10}L`}
              detail={`${waterPct}% of ${(pulse.waterGoalMl / 1000).toFixed(1)}L goal`}
              icon={Droplets}
            />
          </Link>
          <Link href="/dashboard/mindfulness" className="block transition hover:-translate-y-0.5">
            <StatCard
              label="Mood"
              value={pulse.mood == null ? "Not logged" : `${pulse.mood}/5`}
              detail="Mindfulness check-in"
              icon={Wind}
            />
          </Link>
        </div>
      </Stagger>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Panel title="Log sleep">
          <form action={sleepAction.submit} className="grid gap-3">
            <input type="hidden" name="checkin_date" value={today} />
            <FormField label="Hours last night">
              <input
                name="sleep_hours"
                type="number"
                min={0}
                max={24}
                step="0.1"
                required
                defaultValue={
                  pulse.sleepMinutes != null ? (pulse.sleepMinutes / 60).toFixed(1) : "7"
                }
                className={fieldClass}
              />
            </FormField>
            <PrimaryButton disabled={sleepAction.pending}>
              {sleepAction.pending ? "Saving…" : "Save sleep"}
            </PrimaryButton>
          </form>
        </Panel>

        <Panel title="Add water">
          <p className="mb-3 text-xs text-muted">
            {pulse.waterMl} ml of {pulse.waterGoalMl} ml today.
          </p>
          <div className="flex flex-wrap gap-2">
            {[250, 500, 750].map((ml) => (
              <PrimaryButton
                key={ml}
                type="button"
                disabled={waterAction.pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("amount_ml", String(ml));
                  waterAction.submit(fd);
                }}
                className="rounded-full px-4 py-2 text-xs"
              >
                +{ml} ml
              </PrimaryButton>
            ))}
          </div>
        </Panel>

        <Panel title="Mood">
          <form
            action={(fd) => {
              fd.set("mood", mood);
              moodAction.submit(fd);
            }}
            className="grid gap-3"
          >
            <div className="flex flex-wrap gap-2">
              {moods.map(([value, emoji]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(value)}
                  className={`grid size-11 place-items-center rounded-xl text-xl transition ${
                    mood === value ? "bg-accent-soft ring-2 ring-accent" : "bg-surface hover:bg-panel"
                  }`}
                  aria-label={`Mood ${value}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <PrimaryButton disabled={moodAction.pending}>
              {moodAction.pending ? "Saving…" : "Save mood"}
            </PrimaryButton>
          </form>
        </Panel>
      </div>
    </>
  );
}
