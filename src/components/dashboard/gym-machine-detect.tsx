"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Check, ImagePlus, Play, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { identifyMachineFromPhoto, updateGymPlan } from "@/app/dashboard/gym/actions";
import { Panel, PrimaryButton } from "@/components/dashboard/ui";
import {
  gymExerciseCardImage,
  pickTodaysPlanDay,
  suggestGymMoveRest,
  trainingDaysFromPlanDays,
  type GymExercise,
  type GymPlan,
  type GymPlanExercise,
} from "@/lib/gym";
import {
  appendNamedExerciseToPlanDay,
  type MachineDetection,
} from "@/lib/gym-machine-detect";
import { clampGymPlanPrefs } from "@/lib/health/body-metrics";

const KNOWN_MACHINES_KEY = "vivrant.gym.knownMachines";

function persistKnownSlug(slug: string) {
  try {
    const raw = localStorage.getItem(KNOWN_MACHINES_KEY);
    const current = raw ? (JSON.parse(raw) as unknown) : [];
    const slugs = clampGymPlanPrefs({
      known_machine_slugs: [...(Array.isArray(current) ? current : []), slug],
    }).known_machine_slugs;
    localStorage.setItem(KNOWN_MACHINES_KEY, JSON.stringify(slugs));
  } catch {
    // ignore quota / private mode
  }
}

function exerciseFromDetection(
  detection: MachineDetection,
  catalog: GymExercise[],
): GymPlanExercise {
  const match = catalog.find((item) => item.slug === detection.demo_slug);
  const name = match?.name || detection.machine;
  return {
    name,
    sets: detection.sets || "3 x 10",
    rest: suggestGymMoveRest(name, { equipment: match?.equipment, catalog }),
    ...(match?.cues ? { notes: match.cues } : {}),
  };
}

export function MachinePhotoDetect({
  exercises,
  plans = [],
  compact = false,
  onWatchDemo,
  onMarkedKnown,
  onAddToSession,
}: {
  exercises: GymExercise[];
  plans?: GymPlan[];
  compact?: boolean;
  onWatchDemo?: (exercise: GymExercise) => void;
  onMarkedKnown?: (slug: string) => void;
  onAddToSession?: (exercise: GymExercise, sets: string) => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [detection, setDetection] = useState<MachineDetection | null>(null);
  const [identifying, startIdentify] = useTransition();
  const [saving, startSave] = useTransition();
  const [dayPick, setDayPick] = useState("");
  const plan = plans[0] ?? null;
  const bySlug = new Map(exercises.map((item) => [item.slug, item]));
  const matched = detection?.demo_slug ? bySlug.get(detection.demo_slug) ?? null : null;

  function onPhotoChange(file?: File) {
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPhoto(null);
      setPreview(null);
      setDetection(null);
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setDetection(null);
  }

  function identify() {
    if (!photo) {
      toast.error("Attach a photo of the machine first.");
      return;
    }
    const formData = new FormData();
    formData.set("photo", photo);
    startIdentify(async () => {
      const result = await identifyMachineFromPhoto(formData);
      if (!result.ok || !("detection" in result) || !result.detection) {
        toast.error(result.message);
        return;
      }
      setDetection(result.detection);
      toast.success(result.message);
    });
  }

  function markKnown(slug: string) {
    persistKnownSlug(slug);
    onMarkedKnown?.(slug);
    toast.success("Saved as a machine you know — next program can use it.");
  }

  function addToDay(dayIndex: number) {
    if (!plan || !detection?.found) return;
    const nextExercise = exerciseFromDetection(detection, exercises);
    const day = plan.days[dayIndex];
    if (!day) return;
    const nextDay = appendNamedExerciseToPlanDay(day, nextExercise);
    if (nextDay === day) {
      toast.error(
        (day.exercises?.length ?? 0) >= 6
          ? "That day already has 6 moves."
          : "That move is already on this day.",
      );
      return;
    }
    const days = plan.days.map((item, index) => (index === dayIndex ? nextDay : item));
    startSave(async () => {
      const result = await updateGymPlan({
        id: plan.id,
        title: plan.title,
        summary: plan.summary ?? "",
        focus: plan.focus,
        level: plan.level,
        days,
        recommendations: plan.recommendations,
        training_days: trainingDaysFromPlanDays(days).length
          ? trainingDaysFromPlanDays(days)
          : plan.training_days,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Added ${nextExercise.name} to ${day.day}.`);
    });
  }

  function addToToday() {
    if (!plan) {
      toast.error("Save a program first, then add this machine to a day.");
      return;
    }
    const today = pickTodaysPlanDay(plan.days, new Date(), plan.training_days);
    const index = today ? plan.days.findIndex((day) => day.day === today.day) : -1;
    if (index < 0) {
      toast.error("Today is a rest day — pick another program day.");
      return;
    }
    addToDay(index);
  }

  function addToSession() {
    if (!matched || !detection) return;
    onAddToSession?.(matched, detection.sets || "3 x 10");
    toast.success(`Added ${matched.name} to this workout.`);
  }

  const fileInput = (
    <input
      ref={photoRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="sr-only"
      onChange={(event) => onPhotoChange(event.target.files?.[0])}
    />
  );

  const result = detection ? (
    <div className="rounded-[1.3rem] border border-ink/8 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {matched && (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-soft ring-1 ring-ink/8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gymExerciseCardImage(matched) ?? "/vivrant-mark.png"}
              alt=""
              className="size-full object-cover"
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-wide text-accent">
            {detection.found ? `${detection.confidence}% match` : "No catalog match"}
          </p>
          <p className="mt-1 text-sm font-black">{detection.machine}</p>
          {detection.muscle_group ? (
            <p className="mt-0.5 text-xs capitalize text-muted">
              {detection.muscle_group.replaceAll("_", " ")}
              {detection.sets ? ` · ${detection.sets}` : ""}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{detection.why}</p>
      {detection.how_to_use ? (
        <p className="mt-1 text-xs leading-5 text-muted">{detection.how_to_use}</p>
      ) : null}

      {detection.found && (
        <div className="mt-3 flex flex-wrap gap-2">
          {matched && onWatchDemo && (
            <button
              type="button"
              onClick={() => onWatchDemo(matched)}
              className="inline-flex items-center gap-1.5 rounded-full bg-inverse px-3 py-1.5 text-[11px] font-black text-inverse-fg transition hover:bg-accent"
            >
              <Play size={12} fill="currentColor" /> Watch demo
            </button>
          )}
          {detection.demo_slug && (
            <button
              type="button"
              onClick={() => markKnown(detection.demo_slug!)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-[11px] font-black text-accent"
            >
              <Check size={12} /> I use this
            </button>
          )}
          {onAddToSession && matched && (
            <button
              type="button"
              onClick={addToSession}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-[11px] font-black text-accent"
            >
              <Plus size={12} /> Add to this workout
            </button>
          )}
          {plan && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={addToToday}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-[11px] font-black text-accent disabled:opacity-60"
              >
                <Plus size={12} /> Add to today
              </button>
              {plan.days.length > 0 && (
                <label className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-[11px] font-black text-accent">
                  <select
                    value={dayPick}
                    disabled={saving}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDayPick("");
                      const index = Number(value);
                      if (Number.isInteger(index)) addToDay(index);
                    }}
                    className="bg-transparent text-[11px] font-black outline-none"
                    aria-label="Add to a program day"
                  >
                    <option value="">Add to a day…</option>
                    {plan.days.map((day, index) => (
                      <option key={`${day.day}-${index}`} value={index}>
                        {day.day}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      )}

      {detection.alternatives.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted">If that’s not it</p>
          {detection.alternatives.map((item) => {
            const alt = item.demo_slug ? bySlug.get(item.demo_slug) : null;
            return (
              <button
                key={`${item.demo_slug}-${item.machine}`}
                type="button"
                onClick={() => {
                  setDetection({
                    ...detection,
                    found: true,
                    machine: alt?.name ?? item.machine,
                    demo_slug: alt?.slug ?? item.demo_slug,
                    muscle_group: alt?.muscle_group ?? detection.muscle_group,
                    why: item.why,
                  });
                }}
                className="block w-full rounded-xl border border-ink/8 bg-surface/70 px-3 py-2 text-left text-xs transition hover:border-accent/30"
              >
                <span className="font-black">{item.machine}</span>
                <span className="mt-0.5 block text-muted">{item.why}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  if (compact) {
    return (
      <div className="space-y-3">
        {fileInput}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="inline-flex items-center gap-1 text-[11px] font-black text-accent"
          >
            <Camera size={12} />
            {photo ? "Change photo" : "Snap a machine"}
          </button>
          {photo && (
            <PrimaryButton
              type="button"
              disabled={identifying}
              onClick={identify}
              className="rounded-full px-3 py-1.5 text-[11px]"
            >
              {identifying ? "Identifying…" : "Identify"}
            </PrimaryButton>
          )}
          {preview && (
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="size-8 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  if (photoRef.current) photoRef.current.value = "";
                  onPhotoChange();
                }}
                className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-inverse text-inverse-fg"
                aria-label="Remove photo"
              >
                <X size={8} />
              </button>
            </span>
          )}
        </div>
        {result}
      </div>
    );
  }

  return (
    <Panel
      title="What’s this machine?"
      className="mb-4"
      right={<Camera size={16} className="text-accent" />}
    >
      <p className="mb-3 text-sm leading-6 text-muted">
        Snap the machine in front of you. We’ll name it, then you can add it to today, a program day, or the
        machines you already know.
      </p>
      {fileInput}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-xs font-black text-accent transition hover:bg-panel"
        >
          <ImagePlus size={15} />
          {photo ? "Change photo" : "Upload or take a photo"}
        </button>
        {preview && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Machine preview" className="size-14 rounded-xl border border-ink/8 object-cover" />
            <button
              type="button"
              onClick={() => {
                if (photoRef.current) photoRef.current.value = "";
                onPhotoChange();
              }}
              className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-inverse text-inverse-fg"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <PrimaryButton type="button" disabled={identifying || !photo} onClick={identify} className="ml-auto">
          <Camera size={14} className="shrink-0" />
          {identifying ? "Identifying…" : "Identify machine"}
        </PrimaryButton>
      </div>
      {result ? <div className="mt-4">{result}</div> : null}
    </Panel>
  );
}
