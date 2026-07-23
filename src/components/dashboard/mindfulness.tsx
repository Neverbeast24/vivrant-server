"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { coachMindfulness, logMood } from "@/app/dashboard/journal/actions";
import {
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

export function MindfulnessView({
  todayMood,
  weekMoods,
}: {
  todayMood: number | null;
  weekMoods: { checkin_date: string; mood: number | null }[];
}) {
  const { pending, submit } = useModuleAction(logMood);
  const [tipPending, startTip] = useTransition();
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const scored = weekMoods.filter((m) => m.mood != null);
  const avg =
    scored.length > 0
      ? scored.reduce((s, m) => s + Number(m.mood), 0) / scored.length
      : 0;

  return (
    <>
      <PageHeader
        eyebrow="MINDFULNESS"
        title="Notice,"
        highlight="then soften."
        action={
          <PrimaryButton
            disabled={tipPending}
            onClick={() =>
              startTip(async () => {
                const result = await coachMindfulness();
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
            <Sparkles size={14} className="mr-1.5 inline" />
            {tipPending ? "Breathing…" : "Calm tip"}
          </PrimaryButton>
        }
      />
      <Stagger>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Today’s mood"
            value={todayMood != null ? String(todayMood) : "—"}
            suffix="/5"
            detail="Check in honestly"
            icon={Heart}
            className="bg-inverse text-inverse-fg"
          />
          <StatCard
            label="7-day average"
            value={avg ? avg.toFixed(1) : "—"}
            detail={`${scored.length} mood logs`}
            icon={Heart}
          />
          <StatCard
            label="Journal"
            value="Open"
            detail="Write what you notice"
            icon={Sparkles}
          />
        </div>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mood check-in">
          <form action={submit} className="grid gap-3">
            <FormField label="Mood (1 low – 5 high)">
              <input name="mood" type="number" min={1} max={5} required className={fieldClass} />
            </FormField>
            <FormField label="Note" hint="optional">
              <textarea name="note" rows={3} className={fieldClass} />
            </FormField>
            <PrimaryButton disabled={pending}>{pending ? "Saving…" : "Save mood"}</PrimaryButton>
          </form>
          <p className="mt-4 text-sm text-muted">
            Prefer longer notes?{" "}
            <Link href="/dashboard/journal" className="font-bold text-accent underline-offset-2 hover:underline">
              Open journal
            </Link>
          </p>
        </Panel>
        <Panel title="Week pulse">
          <ul className="space-y-2">
            {weekMoods.map((row) => (
              <li
                key={row.checkin_date}
                className="flex justify-between rounded-xl border border-ink/6 px-3 py-2 text-sm"
              >
                <span>{row.checkin_date}</span>
                <span className="font-bold">{row.mood != null ? `${row.mood}/5` : "—"}</span>
              </li>
            ))}
            {!weekMoods.length && <EmptyState>No mood data yet.</EmptyState>}
          </ul>
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
