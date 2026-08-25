"use client";

import { useState } from "react";
import { PrimaryButton, fieldClass } from "@/components/dashboard/ui";
import { GymPlanDaysEditor, cloneGymPlanDays } from "@/components/dashboard/gym-plan-days-editor";
import type { GymMoveCatalogItem, GymPlan, GymPlanDay } from "@/lib/gym";
import { weekdayIsoFromLabel } from "@/lib/gym";

export function SavedGymPlanEditor({
  plan,
  busy,
  onCancel,
  onSave,
  moveOptions = [],
}: {
  plan: GymPlan;
  busy: boolean;
  moveOptions?: GymMoveCatalogItem[];
  onCancel: () => void;
  onSave: (input: {
    id: number;
    title: string;
    summary: string;
    focus?: string;
    level?: string;
    days: GymPlanDay[];
    recommendations?: string[];
    training_days?: number[];
  }) => void;
}) {
  const [title, setTitle] = useState(plan.title);
  const [summary, setSummary] = useState(plan.summary ?? "");
  const [days, setDays] = useState(() => cloneGymPlanDays(plan.days ?? []));

  function save() {
    const cleaned = days.map((day) => ({
      ...day,
      day: day.day.trim() || "Day",
      focus: day.focus.trim() || (day.exercises.some((ex) => ex.name.trim().length >= 2) ? "Training" : "Rest"),
      exercises: day.exercises.filter((ex) => ex.name.trim().length >= 2),
    }));
    const trainingDays = cleaned
      .map((day) => weekdayIsoFromLabel(day.day))
      .filter((iso): iso is number => iso != null);
    onSave({
      id: plan.id,
      title: title.trim(),
      summary: summary.trim(),
      focus: plan.focus,
      level: plan.level,
      days: cleaned,
      recommendations: plan.recommendations,
      training_days: trainingDays.length ? trainingDays : plan.training_days,
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-accent/20 bg-accent-soft/30 p-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
          Program name
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
          maxLength={120}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">
          Summary
        </span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className={`${fieldClass} min-h-20`}
          maxLength={800}
        />
      </label>
      <GymPlanDaysEditor days={days} onChange={setDays} moveOptions={moveOptions} />
      <div className="flex flex-wrap gap-2">
        <PrimaryButton type="button" disabled={busy || title.trim().length < 2} onClick={save} className="rounded-full px-5">
          {busy ? "Saving…" : "Save program"}
        </PrimaryButton>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-xs font-black text-muted transition hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
