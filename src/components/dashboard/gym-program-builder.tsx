"use client";

import { useState } from "react";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { GymPlanDaysEditor, cloneGymPlanDays } from "@/components/dashboard/gym-plan-days-editor";
import { DragGrip, ExerciseDragRow } from "@/components/dashboard/drag-list";
import { Panel, PrimaryButton } from "@/components/dashboard/ui";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { formatGymExerciseLine, GYM_WEEKDAYS, humanizeGymLabel } from "@/lib/gym";
import {
  assembleKeptPlanDays,
  keptIsoList,
  moveKeptDay,
  remainingTrainingDays,
  replaceKeptDaysFromPlan,
  reorderKeptExercises,
  reorderPreviewExercises,
  weekdayKey,
  type GymProgramDraft,
} from "@/lib/gym-program-draft";
import { gymProgramDraftDoc } from "@/lib/share-export";

const SLOT_TYPE = "application/x-viva-slot";

export function GymProgramBuilder({
  draft,
  planning,
  saving,
  onKeep,
  onDrop,
  onGenerate,
  onSave,
  onDiscard,
  onUpdate,
}: {
  draft: GymProgramDraft;
  planning: boolean;
  saving: boolean;
  onKeep: (iso: number) => void;
  onDrop: (iso: number) => void;
  onGenerate: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onUpdate: (draft: GymProgramDraft) => void;
}) {
  const keptIsos = keptIsoList(draft.kept_days);
  const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
  const remainingLabel = remaining
    .map((iso) => GYM_WEEKDAYS.find((item) => item.iso === iso)?.short)
    .filter(Boolean)
    .join(", ");
  const [editingKept, setEditingKept] = useState(false);
  const [keptDraftDays, setKeptDraftDays] = useState(() => cloneGymPlanDays(assembleKeptPlanDays(draft)));

  function startCustomize() {
    setKeptDraftDays(cloneGymPlanDays(assembleKeptPlanDays(draft)));
    setEditingKept(true);
  }

  function applyCustomize() {
    onUpdate(replaceKeptDaysFromPlan(draft, keptDraftDays));
    setEditingKept(false);
  }

  return (
    <Panel
      title="Build your week"
      className="mb-4"
      right={<ShareExportMenu compact doc={gymProgramDraftDoc(draft)} />}
    >
      <p className="mb-3 text-sm leading-6 text-muted">
        Keep the days you like, then drag workouts between weekdays or reorder moves. Nothing goes on
        your program list until you save.
      </p>
      <p className="mb-4 text-xs font-black text-accent">
        {keptIsos.length}/{draft.training_days.length} days kept
        {remaining.length ? ` · still need ${remainingLabel}` : " · ready to save"}
      </p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {draft.training_days.map((iso) => {
          const weekday = GYM_WEEKDAYS.find((item) => item.iso === iso);
          const kept = draft.kept_days[weekdayKey(iso)];
          return (
            <div
              key={`slot-${iso}`}
              draggable={Boolean(kept)}
              onDragStart={(event) => {
                if (!kept) return;
                event.dataTransfer.setData(SLOT_TYPE, String(iso));
                event.dataTransfer.setData("text/plain", String(iso));
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                const from = Number(event.dataTransfer.getData(SLOT_TYPE) || event.dataTransfer.getData("text/plain"));
                if (Number.isFinite(from) && from >= 1) onUpdate(moveKeptDay(draft, from, iso));
              }}
              className={`rounded-2xl border px-3 py-3 ${
                kept ? "border-accent/30 bg-accent-soft/40" : "border-ink/8 bg-surface/60"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                {weekday?.full ?? `Day ${iso}`}
                {kept ? " · drag to another day" : ""}
              </p>
              {kept ? (
                <>
                  <p className="mt-1 text-sm font-black">{humanizeGymLabel(kept.focus)}</p>
                  <ul className="mt-2 space-y-1">
                    {(kept.exercises ?? []).map((ex, exIndex) => (
                      <ExerciseDragRow
                        key={`${iso}-${exIndex}-${ex.name}`}
                        index={exIndex}
                        onMove={(from, to) => onUpdate(reorderKeptExercises(draft, iso, from, to))}
                        className="text-xs leading-5 text-muted"
                      >
                        <span className="inline-flex items-center gap-1">
                          <DragGrip label={`Reorder ${ex.name}`} />
                          {formatGymExerciseLine(ex)}
                        </span>
                      </ExerciseDragRow>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onDrop(iso)}
                    className="mt-2 text-[11px] font-black text-accent"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">Drop a kept day here, or keep one below</p>
              )}
            </div>
          );
        })}
      </div>

      {keptIsos.length > 0 && (
        <div className="mb-4">
          {editingKept ? (
            <div className="rounded-2xl border border-accent/20 bg-accent-soft/30 p-3">
              <GymPlanDaysEditor days={keptDraftDays} onChange={setKeptDraftDays} />
              <div className="mt-3 flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={applyCustomize} className="rounded-full px-4">
                  Apply customization
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setEditingKept(false)}
                  className="text-xs font-black text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCustomize}
              className="text-[11px] font-black text-accent"
            >
              Customize kept days
            </button>
          )}
        </div>
      )}

      {draft.preview_days.length > 0 && (
        <>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
            Latest generated workouts
          </p>
          <div className="space-y-3">
            {draft.preview_days.map((day, dayIndex) => {
              const iso =
                GYM_WEEKDAYS.find((item) => day.day.toLowerCase().includes(item.full.toLowerCase()))
                  ?.iso ?? null;
              const alreadyKept = iso != null && Boolean(draft.kept_days[weekdayKey(iso)]);
              return (
                <article
                  key={day.day}
                  className="rounded-2xl border border-ink/8 bg-card px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black">{day.day}</p>
                      <p className="text-xs capitalize text-muted">{humanizeGymLabel(day.focus)}</p>
                    </div>
                    {iso != null && (
                      <button
                        type="button"
                        onClick={() => onKeep(iso)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black ${
                          alreadyKept
                            ? "bg-accent text-inverse-fg"
                            : "border border-ink/10 bg-surface text-accent hover:border-accent/40"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                        {alreadyKept ? "Replace kept day" : "Keep this day"}
                      </button>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {(day.exercises ?? []).map((ex, exIndex) => (
                      <ExerciseDragRow
                        key={`${day.day}-${exIndex}-${ex.name}`}
                        index={exIndex}
                        onMove={(from, to) => onUpdate(reorderPreviewExercises(draft, dayIndex, from, to))}
                        className="text-xs leading-5 text-muted"
                      >
                        <span className="inline-flex items-center gap-1">
                          <DragGrip label={`Reorder ${ex.name}`} />
                          {formatGymExerciseLine(ex)}
                        </span>
                      </ExerciseDragRow>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrimaryButton disabled={planning} onClick={onGenerate} className="rounded-full px-5">
          <Sparkles size={14} className="shrink-0" />
          {planning
            ? "Generating…"
            : remaining.length
              ? "Generate remaining days"
              : "Generate new options"}
        </PrimaryButton>
        <PrimaryButton
          disabled={saving || keptIsos.length === 0}
          onClick={onSave}
          className="rounded-full px-5"
        >
          {saving ? "Saving…" : `Save program · ${keptIsos.length} day${keptIsos.length === 1 ? "" : "s"}`}
        </PrimaryButton>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-muted hover:text-ink"
        >
          <Trash2 size={12} />
          Clear draft
        </button>
      </div>
    </Panel>
  );
}
