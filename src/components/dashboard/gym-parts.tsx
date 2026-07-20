"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Clock3,
  Cog,
  Dumbbell,
  Flame,
  Play,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAiGymPlan,
  deleteGymPlan,
  deleteGymSession,
  logGymSession,
  recommendMachinesWithAi,
} from "@/app/dashboard/gym/actions";
import type { MachineRecommendationPayload } from "@/lib/ai/gemini";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import {
  EmptyState,
  FormField,
  ListRow,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import {
  isMachineGear,
  type GymExercise,
  type GymPlan,
  type GymSession,
} from "@/lib/gym";
import { gymSubNav } from "@/lib/nav";

export type { GymExercise, GymPlan, GymSession };

export function GymOverviewStats({
  sessionCount,
  totalMinutes,
  totalCalories,
  machineCount,
}: {
  sessionCount: number;
  totalMinutes: number;
  totalCalories: number;
  machineCount: number;
}) {
  return (
    <Stagger>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions logged"
          value={String(sessionCount)}
          detail="Your gym history"
          icon={Dumbbell}
          className="bg-gradient-to-br from-[#0a5c4c] to-[#0e7c66] text-white"
        />
        <StatCard
          label="Training time"
          value={String(totalMinutes)}
          detail="Minutes recorded"
          icon={Clock3}
          className="bg-[#e8fbf8] text-[#183d3a]"
        />
        <StatCard
          label="Energy burned"
          value={String(totalCalories)}
          detail="From gym sessions"
          icon={Flame}
          className="bg-[#fff3e8] text-[#533621]"
        />
        <StatCard
          label="Machine demos"
          value={String(machineCount)}
          detail="Guided gym equipment"
          icon={Cog}
          className="bg-[#e8f5f0] text-[#3d2f7a]"
        />
      </div>
    </Stagger>
  );
}

function DemoModal({
  exercise,
  onClose,
}: {
  exercise: GymExercise;
  onClose: () => void;
}) {
  const src = `${exercise.demo_video_url}${exercise.demo_video_url.includes("?") ? "&" : "?"}rel=0`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] grid place-items-center bg-[#0f1a14]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-white/20 bg-[#f6faf7] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <p className="text-sm font-black">{exercise.name}</p>
            <p className="mt-0.5 text-xs capitalize text-[#6a7a71]">
              {exercise.muscle_group} · {exercise.equipment.replaceAll("_", " ")} · {exercise.difficulty}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-[#dce8e1]"
            aria-label="Close demo"
          >
            <X size={16} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            title={`${exercise.name} demo`}
            src={src}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {exercise.cues && (
          <p className="px-5 py-4 text-sm leading-6 text-[#55665d]">{exercise.cues}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

function ExerciseGrid({
  exercises,
  onSelect,
}: {
  exercises: GymExercise[];
  onSelect: (exercise: GymExercise) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {exercises.map((exercise) => (
        <button
          key={exercise.id}
          type="button"
          onClick={() => onSelect(exercise)}
          className="group overflow-hidden rounded-[1.3rem] border border-[#14221b]/8 bg-[#f6faf7] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-video overflow-hidden bg-[#dce8e1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exercise.demo_thumbnail_url ?? "/viva-mark.svg"}
              alt=""
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 grid place-items-center bg-[#0f1a14]/25 opacity-0 transition group-hover:opacity-100">
              <span className="grid size-12 place-items-center rounded-full bg-white text-[#0e7c66] shadow-lg">
                <Play size={18} fill="currentColor" />
              </span>
            </span>
            {isMachineGear(exercise.equipment) && (
              <span className="absolute left-3 top-3 rounded-full bg-[#14221b]/85 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                Machine
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black">{exercise.name}</p>
              <span className="rounded-full bg-[#d7efe6] px-2 py-0.5 text-[10px] font-black capitalize text-[#0e7c66]">
                {exercise.difficulty}
              </span>
            </div>
            <p className="mt-1 text-xs capitalize text-[#6a7a71]">
              {exercise.muscle_group} · {exercise.equipment.replaceAll("_", " ")}
            </p>
          </div>
        </button>
      ))}
      {!exercises.length && <EmptyState>No demos in this filter.</EmptyState>}
    </div>
  );
}

const muscleFilters = [
  "all",
  "legs",
  "chest",
  "back",
  "shoulders",
  "arms",
  "glutes",
  "core",
  "hamstrings",
  "cardio",
  "mobility",
] as const;

export function GymDemosView({ exercises }: { exercises: GymExercise[] }) {
  const [muscle, setMuscle] = useState<(typeof muscleFilters)[number]>("all");
  const [activeDemo, setActiveDemo] = useState<GymExercise | null>(null);
  const freeWeight = exercises.filter((item) => !isMachineGear(item.equipment));
  const filtered = useMemo(
    () =>
      muscle === "all" ? freeWeight : freeWeight.filter((item) => item.muscle_group === muscle),
    [freeWeight, muscle],
  );

  return (
    <>
      <PageHeader eyebrow="GYM · DEMOS" title="Form first," highlight="then load." />
      <ModuleSubNav items={gymSubNav} />
      <Panel title="Free-weight & bodyweight demos" right={<Play size={16} className="text-[#0e7c66]" />}>
        <div className="mb-4 flex flex-wrap gap-2">
          {muscleFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMuscle(item)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize transition ${
                muscle === item
                  ? "bg-[#14221b] text-white"
                  : "bg-[#e8efe9] text-[#52635a] hover:bg-white"
              }`}
            >
              {item === "all" ? "All muscles" : item}
            </button>
          ))}
        </div>
        <ExerciseGrid exercises={filtered} onSelect={setActiveDemo} />
      </Panel>
      <AnimatePresence>
        {activeDemo && <DemoModal exercise={activeDemo} onClose={() => setActiveDemo(null)} />}
      </AnimatePresence>
    </>
  );
}

export function GymMachinesView({ exercises }: { exercises: GymExercise[] }) {
  const [muscle, setMuscle] = useState<(typeof muscleFilters)[number]>("all");
  const [gear, setGear] = useState<"all" | "machine" | "cable" | "cardio_machine">("all");
  const [activeDemo, setActiveDemo] = useState<GymExercise | null>(null);
  const [recommending, startRecommend] = useTransition();
  const [machineRecs, setMachineRecs] = useState<MachineRecommendationPayload | null>(null);
  const bySlug = useMemo(() => new Map(exercises.map((item) => [item.slug, item])), [exercises]);
  const machines = exercises.filter((item) => isMachineGear(item.equipment));

  const filtered = useMemo(
    () =>
      machines.filter((item) => {
        const muscleOk = muscle === "all" || item.muscle_group === muscle;
        const gearOk = gear === "all" || item.equipment === gear;
        return muscleOk && gearOk;
      }),
    [gear, machines, muscle],
  );

  function recommendMachines() {
    startRecommend(async () => {
      const result = await recommendMachinesWithAi();
      if (!result.ok || !("recommendation" in result) || !result.recommendation) {
        toast.error(result.message);
        return;
      }
      setMachineRecs(result.recommendation);
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="GYM · MACHINES"
        title="Know the"
        highlight="equipment."
        action={
          <PrimaryButton
            disabled={recommending}
            onClick={recommendMachines}
            className="rounded-full bg-[#0e7c66] px-5"
          >
            <Cog size={14} className="mr-1.5 inline" />
            {recommending ? "Matching…" : "AI machine picks"}
          </PrimaryButton>
        }
      />
      <ModuleSubNav items={gymSubNav} />

      {machineRecs && (
        <Panel
          title={machineRecs.title}
          className="mb-4"
          right={
            <span className="rounded-full bg-[#d7efe6] px-3 py-1 text-[11px] font-black text-[#0e7c66]">
              {machineRecs.focus}
            </span>
          }
        >
          <p className="mb-4 text-sm leading-6 text-[#55665d]">{machineRecs.summary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {[...machineRecs.recommendations]
              .sort((a, b) => a.priority - b.priority)
              .map((item) => {
                const demo = item.demo_slug ? bySlug.get(item.demo_slug) : null;
                return (
                  <article
                    key={`${item.priority}-${item.machine}`}
                    className="rounded-[1.3rem] border border-[#14221b]/8 bg-[#f6faf7] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black tracking-wide text-[#0e7c66]">
                          PICK #{item.priority}
                        </p>
                        <p className="mt-1 text-sm font-black">{item.machine}</p>
                      </div>
                      <span className="rounded-full bg-[#e8efe9] px-2.5 py-1 text-[10px] font-black text-[#52635a]">
                        {item.sets}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#55665d]">{item.why}</p>
                    <p className="mt-2 text-xs leading-5 text-[#6a7a71]">{item.how_to_use}</p>
                    {demo && (
                      <button
                        type="button"
                        onClick={() => setActiveDemo(demo)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#14221b] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-[#0e7c66]"
                      >
                        <Play size={12} fill="currentColor" /> Watch demo
                      </button>
                    )}
                  </article>
                );
              })}
          </div>
        </Panel>
      )}

      <Panel title="Machine demo library" right={<Cog size={16} className="text-[#0e7c66]" />}>
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All machines"],
              ["machine", "Strength machines"],
              ["cable", "Cables"],
              ["cardio_machine", "Cardio machines"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setGear(id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                gear === id ? "bg-[#0e7c66] text-white" : "bg-[#d7efe6] text-[#0e7c66] hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {muscleFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMuscle(item)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize transition ${
                muscle === item
                  ? "bg-[#14221b] text-white"
                  : "bg-[#e8efe9] text-[#52635a] hover:bg-white"
              }`}
            >
              {item === "all" ? "All muscles" : item}
            </button>
          ))}
        </div>
        <ExerciseGrid exercises={filtered} onSelect={setActiveDemo} />
      </Panel>

      <AnimatePresence>
        {activeDemo && <DemoModal exercise={activeDemo} onClose={() => setActiveDemo(null)} />}
      </AnimatePresence>
    </>
  );
}

export function GymSessionsView({ sessions }: { sessions: GymSession[] }) {
  const { pending, submit } = useModuleAction(logGymSession);
  const [busy, start] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader eyebrow="GYM · SESSIONS" title="Log what you" highlight="trained." />
      <ModuleSubNav items={gymSubNav} />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Log a gym session">
          <form action={submit} className="grid gap-3 sm:grid-cols-2">
            <FormField label="Session title" hint="Required" className="sm:col-span-2">
              <input name="title" required placeholder="e.g. Machine circuit + cardio" className={fieldClass} />
            </FormField>
            <FormField label="Focus">
              <select name="focus" defaultValue="full_body" className={fieldClass}>
                <option value="full_body">Full body</option>
                <option value="strength">Strength</option>
                <option value="fat_loss">Fat loss</option>
                <option value="mobility">Mobility</option>
                <option value="endurance">Endurance</option>
                <option value="upper">Upper</option>
                <option value="lower">Lower</option>
                <option value="core">Core</option>
              </select>
            </FormField>
            <FormField label="Duration" hint="minutes">
              <input name="duration_minutes" type="number" min={5} required defaultValue={45} className={fieldClass} />
            </FormField>
            <FormField label="Calories" hint="optional">
              <input name="calories_burned" type="number" min={0} placeholder="0" className={fieldClass} />
            </FormField>
            <FormField label="Exercises / machines" hint="one per line" className="sm:col-span-2">
              <textarea
                name="exercises"
                rows={4}
                placeholder={"Leg press machine\nLat pulldown\nCable face pull"}
                className={`${fieldClass} min-h-28 resize-y`}
              />
            </FormField>
            <FormField label="Notes" className="sm:col-span-2">
              <input name="notes" placeholder="Seat settings / weight used" className={fieldClass} />
            </FormField>
            <PrimaryButton disabled={pending} className="sm:col-span-2">
              {pending ? "Saving…" : "Log session"}
            </PrimaryButton>
          </form>
        </Panel>

        <Panel title="Recent sessions" right={<Target size={16} className="text-[#0e7c66]" />}>
          <div className="space-y-2">
            {sessions.map((session) => (
              <ListRow
                key={session.id}
                title={session.title}
                meta={`${session.focus.replace("_", " ")} · ${session.duration_minutes ?? 0} min`}
                right={
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-black">{session.calories_burned ?? 0} kcal</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => deleteGymSession(session.id))}
                      className="grid size-8 place-items-center rounded-lg text-[#8a9a91] transition hover:bg-[#f8ece4] hover:text-[#c45c2a]"
                      aria-label={`Delete ${session.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                }
              />
            ))}
            {!sessions.length && <EmptyState>No gym sessions yet. Log your first training block.</EmptyState>}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function GymPlansView({
  plans,
  exercises,
}: {
  plans: GymPlan[];
  exercises: GymExercise[];
}) {
  const [busy, start] = useTransition();
  const [planning, startPlan] = useTransition();
  const [activeDemo, setActiveDemo] = useState<GymExercise | null>(null);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function generatePlan() {
    startPlan(async () => {
      const result = await createAiGymPlan();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="GYM · AI PLANS"
        title="Programs that"
        highlight="fit you."
        action={
          <PrimaryButton disabled={planning} onClick={generatePlan} className="rounded-full px-5">
            <Sparkles size={14} className="mr-1.5 inline" />
            {planning ? "Building plan…" : "Generate AI plan"}
          </PrimaryButton>
        }
      />
      <ModuleSubNav items={gymSubNav} />
      <Panel title="Saved AI gym plans">
        <div className="space-y-4">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-[1.3rem] border border-[#14221b]/8 bg-[#e8efe9]/45 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{plan.title}</p>
                  <p className="mt-1 text-xs capitalize text-[#6a7a71]">
                    {plan.focus.replace("_", " ")} · {plan.level} · {plan.days_per_week} days/week
                  </p>
                  {plan.summary && <p className="mt-2 text-sm leading-6 text-[#55665d]">{plan.summary}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => deleteGymPlan(plan.id))}
                  className="grid size-8 place-items-center rounded-lg text-[#8a9a91] transition hover:bg-[#f8ece4] hover:text-[#c45c2a]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(plan.days ?? []).map((day) => (
                  <div key={`${plan.id}-${day.day}`} className="rounded-2xl border border-black/5 bg-white/80 p-3">
                    <p className="text-xs font-black text-[#0e7c66]">{day.day}</p>
                    <p className="mt-1 text-sm font-bold">{day.focus}</p>
                    <ul className="mt-2 space-y-1.5">
                      {(day.exercises ?? []).map((ex) => {
                        const linked = exercises.find(
                          (item) => item.name.toLowerCase() === ex.name.toLowerCase(),
                        );
                        return (
                          <li key={`${day.day}-${ex.name}`} className="text-xs text-[#55665d]">
                            {linked ? (
                              <button
                                type="button"
                                onClick={() => setActiveDemo(linked)}
                                className="font-bold text-[#0e7c66] underline-offset-2 hover:underline"
                              >
                                {ex.name}
                              </button>
                            ) : (
                              <span className="font-bold text-[#1e2f26]">{ex.name}</span>
                            )}{" "}
                            · {ex.sets} · rest {ex.rest}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!plans.length && (
            <EmptyState>Generate an AI gym plan with machines matched to your profile.</EmptyState>
          )}
        </div>
      </Panel>
      <AnimatePresence>
        {activeDemo && <DemoModal exercise={activeDemo} onClose={() => setActiveDemo(null)} />}
      </AnimatePresence>
    </>
  );
}
