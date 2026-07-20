"use client";

import { useState, useTransition } from "react";
import { Activity, Sparkles, Trash2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  addHealthHistoryEntry,
  analyzeHealthHistoryWithAi,
  deleteHealthHistoryEntry,
} from "@/app/dashboard/settings/health-history-actions";
import {
  EmptyState,
  FormField,
  Panel,
  PrimaryButton,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

export type HealthHistoryEntry = {
  id: number;
  recorded_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  note: string | null;
  source: string;
};

function bmiFor(weight: number | null, height: number | null) {
  if (!weight || !height) return null;
  return weight / (height / 100) ** 2;
}

export function HealthHistoryPanel({ entries }: { entries: HealthHistoryEntry[] }) {
  const { pending, submit } = useModuleAction(addHealthHistoryEntry);
  const [busy, start] = useTransition();
  const [analyzing, startAnalyze] = useTransition();
  const [insight, setInsight] = useState<{
    title: string;
    body: string;
    trend: string;
    next_step: string;
    score: number;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const latest = entries[0];
  const previous = entries[1];
  const delta =
    latest?.weight_kg != null && previous?.weight_kg != null
      ? Number(latest.weight_kg) - Number(previous.weight_kg)
      : null;

  function analyze() {
    startAnalyze(async () => {
      const result = await analyzeHealthHistoryWithAi();
      if (!result.ok || !("insight" in result) || !result.insight) {
        toast.error(result.message);
        return;
      }
      setInsight(result.insight);
      toast.success(result.message);
    });
  }

  return (
    <Panel
      title="Health history"
      className="mt-4"
      right={
        <button
          type="button"
          disabled={analyzing}
          onClick={analyze}
          className="inline-flex items-center gap-1 text-xs font-black text-[#0e7c66] transition hover:opacity-70"
        >
          <Sparkles size={13} />
          {analyzing ? "Reading…" : "AI trend"}
        </button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#14221b]/8 bg-[#e8efe9]/50 p-4">
          <p className="text-[10px] font-black tracking-wider text-[#6f8077]">LATEST WEIGHT</p>
          <p className="font-display mt-2 text-3xl">
            {latest?.weight_kg != null ? `${latest.weight_kg}` : "—"}
            <span className="ml-1 text-sm font-bold text-[#6f8077]">kg</span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#14221b]/8 bg-[#e8efe9]/50 p-4">
          <p className="text-[10px] font-black tracking-wider text-[#6f8077]">CHANGE</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-black">
            <TrendingDown size={16} className="text-[#0e7c66]" />
            {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
          </p>
        </div>
        <div className="rounded-2xl border border-[#14221b]/8 bg-[#e8efe9]/50 p-4">
          <p className="text-[10px] font-black tracking-wider text-[#6f8077]">BMI</p>
          <p className="font-display mt-2 text-3xl">
            {bmiFor(latest?.weight_kg ?? null, latest?.height_cm ?? null)?.toFixed(1) ?? "—"}
          </p>
        </div>
      </div>

      {insight && (
        <div className="mb-4 rounded-2xl border border-[#0e7c66]/15 bg-[#d7efe6]/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black">{insight.title}</p>
            <span className="text-[10px] font-black text-[#0e7c66]">{insight.score}/100</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5f5867]">{insight.body}</p>
          <p className="mt-3 text-xs font-bold text-[#6a7a71]">Trend: {insight.trend}</p>
          <p className="mt-1 text-xs font-black text-[#0e7c66]">Next: {insight.next_step}</p>
        </div>
      )}

      <form action={submit} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <FormField label="Date" className="lg:col-span-2">
          <input name="recorded_at" type="date" required defaultValue={today} className={fieldClass} />
        </FormField>
        <FormField label="Weight" hint="kg">
          <input name="weight_kg" type="number" min={20} max={400} step="0.1" placeholder="68" className={fieldClass} />
        </FormField>
        <FormField label="Height" hint="cm">
          <input name="height_cm" type="number" min={50} max={250} step="0.1" placeholder="154" className={fieldClass} />
        </FormField>
        <FormField label="Body fat" hint="%">
          <input name="body_fat_pct" type="number" min={3} max={70} step="0.1" placeholder="—" className={fieldClass} />
        </FormField>
        <FormField label="Waist" hint="cm">
          <input name="waist_cm" type="number" min={40} max={200} step="0.1" placeholder="—" className={fieldClass} />
        </FormField>
        <FormField label="Note" className="sm:col-span-2 lg:col-span-4">
          <input name="note" placeholder="Morning weigh-in, after coffee, etc." className={fieldClass} />
        </FormField>
        <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-2">
          {pending ? "Saving…" : "Add entry"}
        </PrimaryButton>
      </form>

      <div className="space-y-2">
        {entries.map((entry) => {
          const bmi = bmiFor(entry.weight_kg, entry.height_cm);
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl border border-[#14221b]/6 bg-[#e8efe9]/40 px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#d7efe6] text-[#0e7c66]">
                <Activity size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">
                  {new Date(entry.recorded_at).toLocaleDateString()}
                  {entry.weight_kg != null ? ` · ${entry.weight_kg} kg` : ""}
                  {bmi != null ? ` · BMI ${bmi.toFixed(1)}` : ""}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6a7a71]">
                  {[
                    entry.height_cm != null ? `${entry.height_cm} cm` : null,
                    entry.body_fat_pct != null ? `${entry.body_fat_pct}% fat` : null,
                    entry.waist_cm != null ? `${entry.waist_cm} cm waist` : null,
                    entry.note,
                    entry.source !== "manual" ? entry.source.replace("_", " ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Logged measurement"}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    const result = await deleteHealthHistoryEntry(entry.id);
                    if (result.ok) toast.success(result.message);
                    else toast.error(result.message);
                  })
                }
                className="grid size-8 place-items-center rounded-lg text-[#8a9a91] transition hover:bg-[#f8ece4] hover:text-[#c45c2a]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {!entries.length && (
          <EmptyState>No history yet. Log weigh-ins here or update your profile weight.</EmptyState>
        )}
      </div>
    </Panel>
  );
}
