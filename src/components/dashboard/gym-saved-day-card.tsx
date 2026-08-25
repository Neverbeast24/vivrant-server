"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import { GymMovePicker } from "@/components/dashboard/gym-move-picker";
import {
  addExerciseToPlanDay,
  cloneGymPlanDay,
  formatGymExerciseLine,
  GYM_WEEKDAYS,
  humanizeGymLabel,
  moveSavedPlanDay,
  weekdayIsoFromLabel,
  type GymMoveCatalogItem,
  type GymPlan,
  type GymPlanDay,
  type GymPlanExercise,
} from "@/lib/gym";

const tinyField =
  "w-full rounded-lg border border-ink/10 bg-surface/70 px-2 py-1 text-[11px] outline-none placeholder:text-muted hover:border-ink/18 focus:border-accent/45";

export function GymSavedDayCard({
  plan,
  day,
  dayIndex,
  isToday,
  busy,
  moveOptions = [],
  onSaveDays,
}: {
  plan: GymPlan;
  day: GymPlanDay;
  dayIndex: number;
  isToday: boolean;
  busy: boolean;
  moveOptions?: GymMoveCatalogItem[];
  onSaveDays: (days: GymPlanDay[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GymPlanDay>(() => cloneGymPlanDay(day));
  const currentIso = weekdayIsoFromLabel(day.day);

  function startEdit(nextDay: GymPlanDay = cloneGymPlanDay(day)) {
    setDraft(nextDay);
    setEditing(true);
  }

  function updateExercise(index: number, patch: Partial<GymPlanExercise>) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    }));
  }

  async function removeExercise(index: number) {
    const name = draft.exercises[index]?.name || "this move";
    if (!(await confirmDelete(name))) return;
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((_, i) => i !== index),
    }));
  }

  function saveEdit() {
    const cleaned: GymPlanDay = {
      ...draft,
      day: draft.day.trim() || day.day,
      focus: draft.focus.trim() || "Training",
      exercises: draft.exercises.filter((ex) => ex.name.trim().length >= 2),
    };
    const days = (plan.days ?? []).map((item, index) => (index === dayIndex ? cleaned : item));
    onSaveDays(days);
    setEditing(false);
  }

  function addMove() {
    const source = editing ? draft : cloneGymPlanDay(day);
    const next = addExerciseToPlanDay(source);
    if (next.exercises.length === source.exercises.length) return;
    startEdit(next);
  }

  function moveTo(iso: number) {
    if (iso === currentIso) return;
    onSaveDays(moveSavedPlanDay(plan.days ?? [], dayIndex, iso));
  }

  return (
    <div
      className={`rounded-2xl border p-3 ${
        isToday ? "border-accent/30 bg-accent-soft/30" : "border-ink/5 bg-panel/80"
      }`}
    >
      <p className="text-xs font-black text-accent">
        {day.day}
        {isToday ? " · today" : ""}
      </p>
      <p className="mt-1 text-sm font-bold capitalize">{humanizeGymLabel(day.focus)}</p>

      {editing ? (
        <div className="mt-2 space-y-2">
          <input
            value={draft.focus}
            onChange={(event) => setDraft((current) => ({ ...current, focus: event.target.value }))}
            className={tinyField}
            placeholder="Focus"
            maxLength={60}
            aria-label="Day focus"
          />
          {draft.exercises.map((ex, index) => (
            <div key={`edit-${index}`} className="rounded-lg border border-ink/8 bg-card/80 p-1.5">
              <div className="flex gap-1">
                <div className="min-w-0 flex-1">
                  <GymMovePicker
                    value={ex.name}
                    onChange={(name) => updateExercise(index, { name })}
                    options={moveOptions}
                    className={tinyField}
                    placeholder="Search moves…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void removeExercise(index)}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-ember/15 hover:text-ember"
                  aria-label="Remove move"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <input
                  value={ex.sets}
                  onChange={(event) => updateExercise(index, { sets: event.target.value })}
                  className={tinyField}
                  placeholder="3 x 10"
                  maxLength={40}
                  aria-label="Sets"
                />
                <input
                  value={ex.rest}
                  onChange={(event) => updateExercise(index, { rest: event.target.value })}
                  className={tinyField}
                  placeholder="60s"
                  maxLength={20}
                  aria-label="Rest"
                />
              </div>
            </div>
          ))}
          {draft.exercises.length < 6 && (
            <button
              type="button"
              onClick={() => setDraft((current) => addExerciseToPlanDay(current))}
              className="inline-flex items-center gap-1 text-[11px] font-black text-accent"
            >
              <Plus size={12} />
              Add a move
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveEdit}
              className="rounded-full bg-inverse px-3 py-1 text-[11px] font-black text-inverse-fg"
            >
              Save day
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-3 py-1 text-[11px] font-black text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-1.5 space-y-0.5">
          {(day.exercises ?? []).map((ex) => (
            <li key={`${day.day}-${ex.name}`} className="truncate text-xs text-muted">
              {formatGymExerciseLine(ex)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        <Link
          href={`/dashboard/movement/log?plan=${plan.id}&day=${encodeURIComponent(day.day)}`}
          className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-inverse px-3 py-1.5 text-[11px] font-black text-inverse-fg transition hover:bg-accent"
        >
          <Play size={12} fill="currentColor" />
          Start this day
        </Link>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => (editing ? setEditing(false) : startEdit())}
            className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[10px] font-black text-muted hover:border-accent/40 hover:text-accent"
          >
            <Pencil size={11} />
            {editing ? "Close" : "Modify"}
          </button>
          <button
            type="button"
            disabled={busy || (day.exercises ?? []).length >= 6}
            onClick={addMove}
            className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[10px] font-black text-muted hover:border-accent/40 hover:text-accent"
          >
            <Plus size={11} />
            Add
          </button>
          <label className="inline-flex min-w-0 flex-1 items-center">
            <span className="sr-only">Move to another day</span>
            <select
              value={currentIso ?? ""}
              disabled={busy}
              onChange={(event) => moveTo(Number(event.target.value))}
              className="w-full rounded-full border border-ink/10 bg-card px-2 py-1 text-[10px] font-black text-muted outline-none hover:border-accent/40"
            >
              <option value="" disabled>
                Move to…
              </option>
              {GYM_WEEKDAYS.map((item) => (
                <option key={item.iso} value={item.iso}>
                  {item.full}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
