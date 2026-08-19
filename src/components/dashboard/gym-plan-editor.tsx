"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PrimaryButton, fieldClass } from "@/components/dashboard/ui";
import type { GymPlan, GymPlanDay, GymPlanExercise } from "@/lib/gym";

function cloneDays(days: GymPlanDay[]): GymPlanDay[] {
  return days.map((day) => ({
    ...day,
    exercises: (day.exercises ?? []).map((ex) => ({ ...ex })),
    alternatives: day.alternatives?.map((swap) => ({ ...swap })),
    additionals: day.additionals?.map((addon) => ({ ...addon })),
  }));
}

const emptyExercise = (): GymPlanExercise => ({
  name: "",
  sets: "3 x 10",
  rest: "60s",
});

export function SavedGymPlanEditor({
  plan,
  busy,
  onCancel,
  onSave,
}: {
  plan: GymPlan;
  busy: boolean;
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
  const [days, setDays] = useState(() => cloneDays(plan.days ?? []));

  function updateDay(index: number, patch: Partial<GymPlanDay>) {
    setDays((current) => current.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function updateExercise(dayIndex: number, exIndex: number, patch: Partial<GymPlanExercise>) {
    setDays((current) =>
      current.map((day, i) =>
        i !== dayIndex
          ? day
          : {
              ...day,
              exercises: day.exercises.map((ex, j) => (j === exIndex ? { ...ex, ...patch } : ex)),
            },
      ),
    );
  }

  function addExercise(dayIndex: number) {
    setDays((current) =>
      current.map((day, i) =>
        i !== dayIndex || day.exercises.length >= 6
          ? day
          : { ...day, exercises: [...day.exercises, emptyExercise()] },
      ),
    );
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays((current) =>
      current.map((day, i) =>
        i !== dayIndex
          ? day
          : { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) },
      ),
    );
  }

  function save() {
    const cleaned = days.map((day) => ({
      ...day,
      day: day.day.trim() || "Day",
      focus: day.focus.trim() || (day.exercises.some((ex) => ex.name.trim().length >= 2) ? "Training" : "Rest"),
      exercises: day.exercises.filter((ex) => ex.name.trim().length >= 2),
    }));
    onSave({
      id: plan.id,
      title: title.trim(),
      summary: summary.trim(),
      focus: plan.focus,
      level: plan.level,
      days: cleaned,
      recommendations: plan.recommendations,
      training_days: plan.training_days,
    });
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-accent/20 bg-accent-soft/30 p-3">
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
      {days.map((day, dayIndex) => (
        <div key={`${plan.id}-edit-${dayIndex}`} className="rounded-2xl border border-ink/8 bg-card p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={day.day}
              onChange={(event) => updateDay(dayIndex, { day: event.target.value })}
              className={fieldClass}
              placeholder="Day 1"
              maxLength={40}
            />
            <input
              value={day.focus}
              onChange={(event) => updateDay(dayIndex, { focus: event.target.value })}
              className={fieldClass}
              placeholder="Focus"
              maxLength={60}
            />
          </div>
          <ul className="mt-3 space-y-2">
            {day.exercises.map((ex, exIndex) => (
              <li key={`${dayIndex}-${exIndex}`} className="rounded-xl border border-ink/8 bg-surface/70 p-2">
                <div className="flex items-start gap-2">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <input
                      value={ex.name}
                      onChange={(event) => updateExercise(dayIndex, exIndex, { name: event.target.value })}
                      className={fieldClass}
                      placeholder="Move name"
                      maxLength={80}
                    />
                    <input
                      value={ex.sets}
                      onChange={(event) => updateExercise(dayIndex, exIndex, { sets: event.target.value })}
                      className={fieldClass}
                      placeholder="4 x 10–12"
                      maxLength={40}
                    />
                    <input
                      value={ex.weight ?? ""}
                      onChange={(event) => updateExercise(dayIndex, exIndex, { weight: event.target.value })}
                      className={fieldClass}
                      placeholder="Weight"
                      maxLength={40}
                    />
                    <input
                      value={ex.rest}
                      onChange={(event) => updateExercise(dayIndex, exIndex, { rest: event.target.value })}
                      className={fieldClass}
                      placeholder="90s"
                      maxLength={20}
                    />
                    <input
                      value={ex.notes ?? ""}
                      onChange={(event) => updateExercise(dayIndex, exIndex, { notes: event.target.value })}
                      className={`${fieldClass} sm:col-span-2`}
                      placeholder="Cue or note"
                      maxLength={120}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(dayIndex, exIndex)}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ember/15 hover:text-ember"
                    aria-label="Remove move"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {day.exercises.length < 6 && (
            <button
              type="button"
              onClick={() => addExercise(dayIndex)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-accent"
            >
              <Plus size={12} />
              Add a move
            </button>
          )}
        </div>
      ))}
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
