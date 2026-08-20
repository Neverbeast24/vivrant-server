"use client";

import { useMemo, useState } from "react";
import { Check, GitMerge, Sparkles, Trash2 } from "lucide-react";
import { confirmAction } from "@/components/dashboard/confirm-dialog";
import { GymPlanDaysEditor, cloneGymPlanDays } from "@/components/dashboard/gym-plan-days-editor";
import { DragGrip, ExerciseDragRow } from "@/components/dashboard/drag-list";
import { Panel, PrimaryButton } from "@/components/dashboard/ui";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { formatGymExerciseLine, GYM_WEEKDAYS, humanizeGymLabel, type GymPlan } from "@/lib/gym";
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
  type MergeSavedPlanMode,
} from "@/lib/gym-program-draft";
import { gymProgramDraftDoc } from "@/lib/share-export";

const SLOT_TYPE = "application/x-viva-slot";

function CompactMoves({
  exercises,
}: {
  exercises: GymProgramDraft["preview_days"][number]["exercises"];
}) {
  const list = exercises.slice(0, 2);
  const extra = exercises.length - list.length;
  return (
    <>
      <ul className="mt-1.5 space-y-0.5">
        {list.map((ex, index) => (
          <li key={`${index}-${ex.name}`} className="truncate text-xs leading-5 text-muted">
            {formatGymExerciseLine(ex)}
          </li>
        ))}
      </ul>
      {extra > 0 && <p className="mt-1 text-[11px] font-black text-accent">+{extra} more</p>}
    </>
  );
}

export function GymProgramBuilder({
  draft,
  planning,
  saving,
  savedPlans,
  onKeep,
  onDrop,
  onGenerate,
  onSave,
  onDiscard,
  onUpdate,
  onMergePlan,
}: {
  draft: GymProgramDraft;
  planning: boolean;
  saving: boolean;
  savedPlans: GymPlan[];
  onKeep: (iso: number) => void;
  onDrop: (iso: number) => void;
  onGenerate: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onUpdate: (draft: GymProgramDraft) => void;
  onMergePlan: (plan: GymPlan, mode: MergeSavedPlanMode) => void;
}) {
  const keptIsos = keptIsoList(draft.kept_days);
  const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
  const remainingLabel = remaining
    .map((iso) => GYM_WEEKDAYS.find((item) => item.iso === iso)?.short)
    .filter(Boolean)
    .join(", ");
  const [editingKept, setEditingKept] = useState(false);
  const [keptDraftDays, setKeptDraftDays] = useState(() => cloneGymPlanDays(assembleKeptPlanDays(draft)));
  const [expandedSlots, setExpandedSlots] = useState<number[]>([]);
  const [mergePlanId, setMergePlanId] = useState(String(savedPlans[0]?.id ?? ""));

  const previewDays = useMemo(
    () =>
      draft.preview_days.filter((day) => {
        const iso = GYM_WEEKDAYS.find((item) => day.day.toLowerCase().includes(item.full.toLowerCase()))?.iso;
        return iso == null || !draft.kept_days[weekdayKey(iso)];
      }),
    [draft.kept_days, draft.preview_days],
  );

  function startCustomize() {
    setKeptDraftDays(cloneGymPlanDays(assembleKeptPlanDays(draft)));
    setEditingKept(true);
  }

  function applyCustomize() {
    onUpdate(replaceKeptDaysFromPlan(draft, keptDraftDays));
    setEditingKept(false);
  }

  function toggleSlot(iso: number) {
    setExpandedSlots((current) =>
      current.includes(iso) ? current.filter((item) => item !== iso) : [...current, iso],
    );
  }

  const selectedMerge = savedPlans.find((plan) => String(plan.id) === mergePlanId) ?? savedPlans[0];

  return (
    <Panel
      title="Build your week"
      dense
      className="mb-4"
      right={<ShareExportMenu compact doc={gymProgramDraftDoc(draft)} />}
    >
      <p className="mb-2 text-sm leading-5 text-muted">
        Keep the days you like, then drag workouts between weekdays. Nothing is saved until you commit the week.
      </p>
      <p className="mb-3 text-xs font-black text-accent">
        {keptIsos.length}/{draft.training_days.length} days kept
        {remaining.length ? ` · still need ${remainingLabel}` : " · ready to save"}
      </p>

      {savedPlans.length > 0 && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-2xl border border-ink/8 bg-surface/50 px-3 py-2.5">
          <label className="min-w-0 flex-1 text-[10px] font-black uppercase tracking-wider text-muted">
            Pull from a saved program
            <select
              value={selectedMerge ? String(selectedMerge.id) : ""}
              onChange={(event) => setMergePlanId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 bg-card px-2.5 py-1.5 text-xs font-bold text-ink"
            >
              {savedPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!selectedMerge}
            onClick={() => selectedMerge && onMergePlan(selectedMerge, "fill")}
            className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-3 py-1.5 text-[11px] font-black text-accent hover:border-accent/40"
          >
            <GitMerge size={12} />
            Fill empty days
          </button>
          <button
            type="button"
            disabled={!selectedMerge}
            onClick={() => selectedMerge && onMergePlan(selectedMerge, "overwrite")}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black text-muted hover:text-ink"
          >
            Replace matching days
          </button>
        </div>
      )}

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {draft.training_days.map((iso) => {
          const weekday = GYM_WEEKDAYS.find((item) => item.iso === iso);
          const kept = draft.kept_days[weekdayKey(iso)];
          const expanded = expandedSlots.includes(iso);
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
              className={`rounded-2xl border px-3 py-2.5 ${
                kept ? "border-accent/30 bg-accent-soft/40" : "border-ink/8 bg-surface/60"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                {weekday?.full ?? `Day ${iso}`}
                {kept ? " · drag" : ""}
              </p>
              {kept ? (
                <>
                  <p className="mt-0.5 text-sm font-black">{humanizeGymLabel(kept.focus)}</p>
                  {expanded ? (
                    <ul className="mt-1.5 space-y-1">
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
                  ) : (
                    <CompactMoves exercises={kept.exercises ?? []} />
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {(kept.exercises ?? []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => toggleSlot(iso)}
                        className="text-[11px] font-black text-muted"
                      >
                        {expanded ? "Show less" : "Show all"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDrop(iso)}
                      className="text-[11px] font-black text-accent"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">Drop a kept day here, or keep one below</p>
              )}
            </div>
          );
        })}
      </div>

      {keptIsos.length > 0 && (
        <div className="mb-3">
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

      {previewDays.length > 0 && (
        <>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
            New options for remaining days
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {previewDays.map((day) => {
              const dayIndex = draft.preview_days.indexOf(day);
              const iso =
                GYM_WEEKDAYS.find((item) => day.day.toLowerCase().includes(item.full.toLowerCase()))
                  ?.iso ?? null;
              const alreadyKept = iso != null && Boolean(draft.kept_days[weekdayKey(iso)]);
              const expanded = iso != null && expandedSlots.includes(iso + 100);
              return (
                <article
                  key={day.day}
                  className="rounded-2xl border border-ink/8 bg-card px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black">{day.day}</p>
                      <p className="text-xs capitalize text-muted">{humanizeGymLabel(day.focus)}</p>
                    </div>
                    {iso != null && (
                      <button
                        type="button"
                        onClick={() => onKeep(iso)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black ${
                          alreadyKept
                            ? "bg-accent text-accent-fg"
                            : "border border-ink/10 bg-surface text-accent hover:border-accent/40"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                        {alreadyKept ? "Replace" : "Keep"}
                      </button>
                    )}
                  </div>
                  {expanded ? (
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
                  ) : (
                    <CompactMoves exercises={day.exercises ?? []} />
                  )}
                  {(day.exercises ?? []).length > 2 && iso != null && (
                    <button
                      type="button"
                      onClick={() => toggleSlot(iso + 100)}
                      className="mt-1 text-[11px] font-black text-muted"
                    >
                      {expanded ? "Show less" : "Show all"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
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
          onClick={async () => {
            if (
              !(await confirmAction({
                title: "Clear this draft?",
                body: "Unsaved generated days will be discarded.",
                confirmLabel: "Clear",
              }))
            )
              return;
            onDiscard();
          }}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-muted hover:text-ink"
        >
          <Trash2 size={12} />
          Clear draft
        </button>
      </div>
    </Panel>
  );
}
