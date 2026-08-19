"use client";

import { Plus, Trash2 } from "lucide-react";
import { fieldClass } from "@/components/dashboard/ui";
import { DayDragRow, DragGrip, ExerciseDragRow } from "@/components/dashboard/drag-list";
import type { GymPlanDay, GymPlanExercise } from "@/lib/gym";
import { moveItem } from "@/lib/reorder";

const emptyExercise = (): GymPlanExercise => ({
  name: "",
  sets: "3 x 10",
  rest: "60s",
});

export function cloneGymPlanDays(days: GymPlanDay[]): GymPlanDay[] {
  return days.map((day) => ({
    ...day,
    exercises: (day.exercises ?? []).map((ex) => ({ ...ex })),
    alternatives: day.alternatives?.map((swap) => ({ ...swap })),
    additionals: day.additionals?.map((addon) => ({ ...addon })),
  }));
}

export function GymPlanDaysEditor({
  days,
  onChange,
}: {
  days: GymPlanDay[];
  onChange: (days: GymPlanDay[]) => void;
}) {
  function updateDay(index: number, patch: Partial<GymPlanDay>) {
    onChange(days.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  function updateExercise(dayIndex: number, exIndex: number, patch: Partial<GymPlanExercise>) {
    onChange(
      days.map((day, i) =>
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
    onChange(
      days.map((day, i) =>
        i !== dayIndex || day.exercises.length >= 6
          ? day
          : { ...day, exercises: [...day.exercises, emptyExercise()] },
      ),
    );
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    onChange(
      days.map((day, i) =>
        i !== dayIndex ? day : { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) },
      ),
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold leading-4 text-muted">
        Drag the grips to reorder days and moves. On a phone, press and hold a grip, then drop it.
      </p>
      {days.map((day, dayIndex) => (
        <DayDragRow
          key={`day-${dayIndex}-${day.day}`}
          index={dayIndex}
          onMove={(from, to) => onChange(moveItem(days, from, to))}
          className="rounded-2xl border border-ink/8 bg-card p-3"
        >
          <div className="flex items-start gap-2">
            <DragGrip label={`Reorder ${day.day || "day"}`} />
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
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
          </div>
          <ul className="mt-3 space-y-2">
            {day.exercises.map((ex, exIndex) => (
              <ExerciseDragRow
                key={`${dayIndex}-${exIndex}-${ex.name}`}
                index={exIndex}
                onMove={(from, to) =>
                  updateDay(dayIndex, { exercises: moveItem(day.exercises, from, to) })
                }
                className="rounded-xl border border-ink/8 bg-surface/70 p-2"
              >
                <div className="flex items-start gap-2">
                  <DragGrip label={`Reorder ${ex.name || "move"}`} />
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
              </ExerciseDragRow>
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
        </DayDragRow>
      ))}
    </div>
  );
}
