"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import { DayDragRow, DragGrip, ExerciseDragRow } from "@/components/dashboard/drag-list";
import type { GymPlanDay, GymPlanExercise } from "@/lib/gym";
import { formatGymExerciseLine } from "@/lib/gym";
import { moveItem } from "@/lib/reorder";

const compactField =
  "w-full rounded-lg border border-ink/10 bg-surface/70 px-2.5 py-1.5 text-xs outline-none transition placeholder:text-muted hover:border-ink/18 focus:border-accent/45 focus:bg-card focus:ring-2 focus:ring-accent/10";

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
  const [openDay, setOpenDay] = useState(0);

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
    <div className="space-y-2">
      <p className="text-[11px] font-bold leading-4 text-muted">
        Open a day to edit. Drag grips to reorder days and moves.
      </p>
      {days.map((day, dayIndex) => {
        const open = openDay === dayIndex;
        const moveCount = day.exercises.filter((ex) => ex.name.trim()).length;
        return (
          <DayDragRow
            key={`day-${dayIndex}-${day.day}`}
            index={dayIndex}
            onMove={(from, to) => {
              onChange(moveItem(days, from, to));
              setOpenDay(to);
            }}
            className="rounded-xl border border-ink/8 bg-card px-2.5 py-2"
          >
            <div className="flex items-center gap-2">
              <DragGrip label={`Reorder ${day.day || "day"}`} />
              <button
                type="button"
                onClick={() => setOpenDay(open ? -1 : dayIndex)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={open}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{day.day || "Day"}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {day.focus || "Training"}
                    {moveCount ? ` · ${moveCount} move${moveCount === 1 ? "" : "s"}` : ""}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            {open && (
              <div className="mt-2 space-y-2 border-t border-ink/6 pt-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={day.day}
                    onChange={(event) => updateDay(dayIndex, { day: event.target.value })}
                    className={compactField}
                    placeholder="Day 1"
                    maxLength={40}
                  />
                  <input
                    value={day.focus}
                    onChange={(event) => updateDay(dayIndex, { focus: event.target.value })}
                    className={compactField}
                    placeholder="Focus"
                    maxLength={60}
                  />
                </div>
                <ul className="space-y-1.5">
                  {day.exercises.map((ex, exIndex) => (
                    <ExerciseDragRow
                      key={`${dayIndex}-${exIndex}-${ex.name}`}
                      index={exIndex}
                      onMove={(from, to) =>
                        updateDay(dayIndex, { exercises: moveItem(day.exercises, from, to) })
                      }
                      className="rounded-lg border border-ink/8 bg-surface/70 p-1.5"
                    >
                      <div className="flex items-start gap-1.5">
                        <DragGrip label={`Reorder ${ex.name || "move"}`} />
                        <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-4">
                          <input
                            value={ex.name}
                            onChange={(event) =>
                              updateExercise(dayIndex, exIndex, { name: event.target.value })
                            }
                            className={`${compactField} sm:col-span-2`}
                            placeholder="Move name"
                            maxLength={80}
                            aria-label="Move name"
                          />
                          <input
                            value={ex.sets}
                            onChange={(event) =>
                              updateExercise(dayIndex, exIndex, { sets: event.target.value })
                            }
                            className={compactField}
                            placeholder="4 x 10–12"
                            maxLength={40}
                            aria-label="Sets"
                          />
                          <input
                            value={ex.weight ?? ""}
                            onChange={(event) =>
                              updateExercise(dayIndex, exIndex, { weight: event.target.value })
                            }
                            className={compactField}
                            placeholder="Weight"
                            maxLength={40}
                            aria-label="Weight"
                          />
                          <input
                            value={ex.rest}
                            onChange={(event) =>
                              updateExercise(dayIndex, exIndex, { rest: event.target.value })
                            }
                            className={compactField}
                            placeholder="90s"
                            maxLength={20}
                            aria-label="Rest"
                          />
                          <input
                            value={ex.notes ?? ""}
                            onChange={(event) =>
                              updateExercise(dayIndex, exIndex, { notes: event.target.value })
                            }
                            className={`${compactField} sm:col-span-3`}
                            placeholder="Cue or note"
                            maxLength={120}
                            aria-label="Notes"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!(await confirmDelete(ex.name || "this move"))) return;
                            removeExercise(dayIndex, exIndex);
                          }}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ember/15 hover:text-ember"
                          aria-label="Remove move"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {ex.name.trim() && (
                        <p className="mt-1 truncate pl-6 text-[10px] text-muted">
                          {formatGymExerciseLine(ex)}
                        </p>
                      )}
                    </ExerciseDragRow>
                  ))}
                </ul>
                {day.exercises.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addExercise(dayIndex)}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-accent"
                  >
                    <Plus size={12} />
                    Add a move
                  </button>
                )}
              </div>
            )}
          </DayDragRow>
        );
      })}
    </div>
  );
}
