"use client";

import { Check, Sparkles, Trash2 } from "lucide-react";
import { Panel, PrimaryButton } from "@/components/dashboard/ui";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { formatGymExerciseLine, GYM_WEEKDAYS, humanizeGymLabel } from "@/lib/gym";
import {
  keptIsoList,
  remainingTrainingDays,
  weekdayKey,
  type GymProgramDraft,
} from "@/lib/gym-program-draft";
import { gymProgramDraftDoc } from "@/lib/share-export";

export function GymProgramBuilder({
  draft,
  planning,
  saving,
  onKeep,
  onDrop,
  onGenerate,
  onSave,
  onDiscard,
}: {
  draft: GymProgramDraft;
  planning: boolean;
  saving: boolean;
  onKeep: (iso: number) => void;
  onDrop: (iso: number) => void;
  onGenerate: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const keptIsos = keptIsoList(draft.kept_days);
  const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
  const remainingLabel = remaining
    .map((iso) => GYM_WEEKDAYS.find((item) => item.iso === iso)?.short)
    .filter(Boolean)
    .join(", ");

  return (
    <Panel
      title="Build your week"
      className="mb-4"
      right={<ShareExportMenu compact doc={gymProgramDraftDoc(draft)} />}
    >
      <p className="mb-3 text-sm leading-6 text-muted">
        Keep the days you like. Skip the rest, generate again, and pick the next day — nothing goes on
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
              className={`rounded-2xl border px-3 py-3 ${
                kept ? "border-accent/30 bg-accent-soft/40" : "border-ink/8 bg-surface/60"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                {weekday?.full ?? `Day ${iso}`}
              </p>
              {kept ? (
                <>
                  <p className="mt-1 text-sm font-black">{humanizeGymLabel(kept.focus)}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">
                    {(kept.exercises ?? []).slice(0, 2).map((ex) => ex.name).join(" · ") || "Kept"}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDrop(iso)}
                    className="mt-2 text-[11px] font-black text-accent"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">Not picked yet</p>
              )}
            </div>
          );
        })}
      </div>

      {draft.preview_days.length > 0 && (
        <>
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
            Latest generated workouts
          </p>
          <div className="space-y-3">
            {draft.preview_days.map((day) => {
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
                    {(day.exercises ?? []).map((ex) => (
                      <li key={`${day.day}-${ex.name}`} className="text-xs leading-5 text-muted">
                        {formatGymExerciseLine(ex)}
                      </li>
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
