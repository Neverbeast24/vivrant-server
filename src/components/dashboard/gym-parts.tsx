"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Cog,
  Dumbbell,
  ExternalLink,
  Flame,
  Lightbulb,
  Play,
  Plus,
  Repeat2,
  Search,
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
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
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
import { gymPlanDoc, gymPlansDoc, gymSessionsDoc } from "@/lib/share-export";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import {
  enrichGymPlanDays,
  findExerciseMatch,
  humanizeGymLabel,
  isMachineGear,
  pickTodaysPlanDay,
  type GymExercise,
  type GymPlan,
  type GymSession,
} from "@/lib/gym";
import {
  clampGymPlanPrefs,
  GYM_AVOID_TARGETS,
  GYM_PLAN_LEVELS,
  parseRoutineDefaults,
  type GymPlanLevel,
  type RoutineScaling,
} from "@/lib/health/body-metrics";
import { trainingSubNav } from "@/lib/nav";

export type { GymExercise, GymPlan, GymSession };

const PLAN_PREFS_KEY = "vivrant.gym.planPrefs";
const KNOWN_MACHINES_KEY = "vivrant.gym.knownMachines";
const KNOWN_CUSTOM_KEY = "vivrant.gym.knownCustom";
const AVOID_TARGETS_KEY = "vivrant.gym.avoidTargets";

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
          tone="brand"
        />
        <StatCard
          label="Training time"
          value={String(totalMinutes)}
          detail="Minutes recorded"
          icon={Clock3}
          tone="soft"
        />
        <StatCard
          label="Energy burned"
          value={String(totalCalories)}
          detail="From gym sessions"
          icon={Flame}
          tone="warn"
        />
        <StatCard
          label="Machine demos"
          value={String(machineCount)}
          detail="Guided gym equipment"
          icon={Cog}
          tone="soft"
        />
      </div>
    </Stagger>
  );
}

export function GymJumpCards({
  demoCount,
  machineCount,
  sessionCount,
  planCount,
}: {
  demoCount: number;
  machineCount: number;
  sessionCount: number;
  planCount: number;
}) {
  const cards = [
    {
      href: "/dashboard/gym/demos",
      title: "Exercise demos",
      detail: demoCount ? `${demoCount} form clips` : "Free-weight & bodyweight videos",
      icon: Play,
    },
    {
      href: "/dashboard/gym/machines",
      title: "Machines",
      detail: machineCount ? `${machineCount} machine demos + AI picks` : "Equipment walkthroughs",
      icon: Cog,
    },
    {
      href: "/dashboard/gym/sessions",
      title: "Sessions",
      detail: sessionCount ? `${sessionCount} logged recently` : "Log training and review history",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/gym/plans",
      title: "Training program",
      detail: planCount
        ? `${planCount} saved program${planCount === 1 ? "" : "s"}`
        : "Create an AI weekly program",
      icon: Sparkles,
    },
  ] as const;

  return (
    <Stagger>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[1.3rem] border border-ink/8 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
              <card.icon size={18} />
            </span>
            <p className="mt-3 text-sm font-black">{card.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{card.detail}</p>
          </Link>
        ))}
      </div>
    </Stagger>
  );
}

function toDemoEmbedSrc(url: string) {
  const raw = String(url ?? "").trim();
  const idMatch = raw.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  const id = idMatch?.[1];
  if (id) {
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  }
  if (!raw) return "";
  return `${raw}${raw.includes("?") ? "&" : "?"}rel=0`;
}

function DemoModal({
  exercise,
  onClose,
}: {
  exercise: GymExercise;
  onClose: () => void;
}) {
  const src = toDemoEmbedSrc(exercise.demo_video_url);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] grid place-items-center bg-solid/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-panel/20 bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <div>
            <p className="text-sm font-black">{exercise.name}</p>
            <p className="mt-0.5 text-xs capitalize text-muted">
              {exercise.muscle_group.replaceAll("_", " ")} · {exercise.equipment.replaceAll("_", " ")} ·{" "}
              {exercise.difficulty}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-surface-soft"
            aria-label="Close demo"
          >
            <X size={16} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {src ? (
            <iframe
              title={`${exercise.name} demo`}
              src={src}
              className="size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="grid size-full place-items-center px-6 text-center text-sm text-muted">
              Demo video unavailable for this machine.
            </div>
          )}
        </div>
        {exercise.cues && (
          <p className="px-5 py-4 text-sm leading-6 text-muted">{exercise.cues}</p>
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
          className="group overflow-hidden rounded-[1.3rem] border border-ink/8 bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-video overflow-hidden bg-surface-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exercise.demo_thumbnail_url ?? "/vivrant-mark.png"}
              alt=""
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 grid place-items-center bg-solid/25 opacity-0 transition group-hover:opacity-100">
              <span className="grid size-12 place-items-center rounded-full bg-panel text-accent shadow-lg">
                <Play size={18} fill="currentColor" />
              </span>
            </span>
            {isMachineGear(exercise.equipment) && (
              <span className="absolute left-3 top-3 rounded-full bg-inverse/85 px-2.5 py-1 text-[10px] font-black text-inverse-fg backdrop-blur">
                Machine
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black">{exercise.name}</p>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-black capitalize text-accent">
                {exercise.difficulty}
              </span>
            </div>
            <p className="mt-1 text-xs capitalize text-muted">
              {exercise.muscle_group.replaceAll("_", " ")} · {exercise.equipment.replaceAll("_", " ")}
            </p>
          </div>
        </button>
      ))}
      {!exercises.length && (
        <EmptyState>
          No demos match these filters. Try All muscles, or pair Cardio machines with Cardio.
        </EmptyState>
      )}
    </div>
  );
}

function KnownExerciseThumb({ exercise }: { exercise: GymExercise }) {
  return (
    <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-soft ring-1 ring-ink/8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={exercise.demo_thumbnail_url ?? "/vivrant-mark.png"}
        alt=""
        className="size-full object-cover"
        loading="lazy"
      />
    </span>
  );
}

const muscleFilters = [
  "all",
  "legs",
  "inner_thighs",
  "calves",
  "glutes",
  "hamstrings",
  "chest",
  "back",
  "shoulders",
  "traps",
  "arms",
  "forearms",
  "core",
  "lower_back",
  "full_body",
  "cardio",
  "mobility",
] as const;

const muscleFiltersPrimary = [
  "all",
  "legs",
  "glutes",
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "cardio",
] as const;

/** Legs filter also surfaces posterior-chain free-weight demos (RDL, etc.). */
const legsMuscleGroups = new Set(["legs", "hamstrings", "calves", "inner_thighs"]);

function matchesMuscleFilter(
  muscleGroup: string,
  filter: (typeof muscleFilters)[number],
) {
  if (filter === "all") return true;
  if (filter === "legs") return legsMuscleGroups.has(muscleGroup);
  return muscleGroup === filter;
}

function muscleFilterLabel(item: (typeof muscleFilters)[number]) {
  if (item === "all") return "All muscles";
  if (item === "lower_back") return "Lower back";
  if (item === "full_body") return "Full body";
  if (item === "inner_thighs") return "Inner thighs";
  return item.replaceAll("_", " ");
}

function FilterChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "accent";
}) {
  const activeClass =
    tone === "accent" ? "bg-accent text-white" : "bg-inverse text-inverse-fg";
  const idleClass =
    tone === "accent"
      ? "bg-accent-soft text-accent hover:bg-panel"
      : "bg-surface text-muted hover:bg-panel";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-black capitalize transition ${
        active ? activeClass : idleClass
      }`}
    >
      {children}
    </button>
  );
}

function MuscleFilterChips({
  muscle,
  onChange,
}: {
  muscle: (typeof muscleFilters)[number];
  onChange: (next: (typeof muscleFilters)[number]) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const options = showMore
    ? muscleFilters
    : muscleFiltersPrimary.includes(muscle as (typeof muscleFiltersPrimary)[number])
      ? muscleFiltersPrimary
      : ([...muscleFiltersPrimary, muscle] as const);

  return (
    <>
      <FilterChipRow>
        {options.map((item) => (
          <FilterChip key={item} active={muscle === item} onClick={() => onChange(item)}>
            {muscleFilterLabel(item)}
          </FilterChip>
        ))}
      </FilterChipRow>
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mb-4 text-xs font-black text-accent transition hover:underline"
      >
        {showMore ? "Show fewer muscles" : "More muscles"}
      </button>
    </>
  );
}

export function GymDemosView({ exercises }: { exercises: GymExercise[] }) {
  const [muscle, setMuscle] = useState<(typeof muscleFilters)[number]>("all");
  const [activeDemo, setActiveDemo] = useState<GymExercise | null>(null);
  const freeWeight = exercises.filter((item) => !isMachineGear(item.equipment));
  const filtered = useMemo(
    () => freeWeight.filter((item) => matchesMuscleFilter(item.muscle_group, muscle)),
    [freeWeight, muscle],
  );

  return (
    <>
      <PageHeader
        eyebrow="EXERCISE VIDEOS"
        title="Watch a"
        highlight="demo."
      />
      <p className="-mt-2 mb-4 text-sm leading-6 text-muted">
        Short videos that show how to do each move with good form.
      </p>
      <ModuleSubNav items={trainingSubNav} />
      <Panel title="Free-weight & bodyweight demos" right={<Play size={16} className="text-accent" />}>
        <MuscleFilterChips muscle={muscle} onChange={setMuscle} />
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
        const muscleOk = matchesMuscleFilter(item.muscle_group, muscle);
        const gearOk = gear === "all" || item.equipment === gear;
        return muscleOk && gearOk;
      }),
    [gear, machines, muscle],
  );

  function selectGear(next: typeof gear) {
    setGear(next);
    // Cardio machines are tagged "cardio" only — reset muscle so the grid doesn't go empty.
    if (next === "cardio_machine" && muscle !== "all" && muscle !== "cardio") {
      setMuscle("all");
    }
  }

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
        eyebrow="GYM MACHINES"
        title="Learn the"
        highlight="machines."
        action={
          <PrimaryButton
            disabled={recommending}
            onClick={recommendMachines}
            className="rounded-full bg-accent px-5"
          >
            <Cog size={14} className="shrink-0" />
            {recommending ? "Finding matches…" : "Suggest machines for me"}
          </PrimaryButton>
        }
      />
      <p className="-mt-2 mb-4 text-sm leading-6 text-muted">
        Watch demos for gym machines, or get a short list picked for you.
      </p>
      <ModuleSubNav items={trainingSubNav} />

      {machineRecs && (
        <Panel
          title={machineRecs.title}
          className="mb-4"
          right={
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-black text-accent">
              {machineRecs.focus}
            </span>
          }
        >
          <p className="mb-4 text-sm leading-6 text-muted">{machineRecs.summary}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {[...machineRecs.recommendations]
              .sort((a, b) => a.priority - b.priority)
              .map((item) => {
                const demo = item.demo_slug ? bySlug.get(item.demo_slug) : null;
                return (
                  <article
                    key={`${item.priority}-${item.machine}`}
                    className="rounded-[1.3rem] border border-ink/8 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {demo && <KnownExerciseThumb exercise={demo} />}
                        <div className="min-w-0">
                          <p className="text-[11px] font-black tracking-wide text-accent">
                            PICK #{item.priority}
                          </p>
                          <p className="mt-1 text-sm font-black">{item.machine}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-black text-muted">
                        {item.sets}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">{item.why}</p>
                    <p className="mt-2 text-xs leading-5 text-muted">{item.how_to_use}</p>
                    {demo && (
                      <button
                        type="button"
                        onClick={() => setActiveDemo(demo)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-inverse px-3 py-1.5 text-[11px] font-black text-inverse-fg transition hover:bg-accent"
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

      <Panel title="Machine demo library" right={<Cog size={16} className="text-accent" />}>
        <FilterChipRow>
          {(
            [
              ["all", "All machines"],
              ["machine", "Strength machines"],
              ["cable", "Cables"],
              ["cardio_machine", "Cardio machines"],
            ] as const
          ).map(([id, label]) => (
            <FilterChip key={id} tone="accent" active={gear === id} onClick={() => selectGear(id)}>
              {label}
            </FilterChip>
          ))}
        </FilterChipRow>
        <MuscleFilterChips muscle={muscle} onChange={setMuscle} />
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
      <PageHeader eyebrow="GYM WORKOUTS" title="Log what you" highlight="trained." />
      <p className="-mt-2 mb-4 text-sm leading-6 text-muted">
        Save a gym session so you can look back at your progress.
      </p>
      <ModuleSubNav items={trainingSubNav} />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Log a gym workout">
          <form action={submit} className="grid gap-3 sm:grid-cols-2">
            <FormField label="Workout name" hint="Required" className="sm:col-span-2">
              <input name="title" required placeholder="e.g. Leg day" className={fieldClass} />
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
              {pending ? "Saving…" : "Save workout"}
            </PrimaryButton>
          </form>
        </Panel>

        <Panel
          title="Recent workouts"
          right={
            <div className="flex flex-wrap items-center gap-2">
              {sessions.length > 0 && <ShareExportMenu compact doc={gymSessionsDoc(sessions)} />}
              <Target size={16} className="text-accent" />
            </div>
          }
        >
          <div className="space-y-2">
            {sessions.map((session) => (
              <ListRow
                key={session.id}
                title={session.title}
                meta={`${humanizeGymLabel(session.focus)} · ${session.duration_minutes ?? 0} min`}
                right={
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-black">{session.calories_burned ?? 0} kcal</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => deleteGymSession(session.id))}
                      className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
                      aria-label={`Delete ${session.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                }
              />
            ))}
            {!sessions.length && (
              <EmptyState>No workouts yet. Log your first gym session on the left.</EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function GymPlansView({
  plans,
  exercises,
  scaling = null,
}: {
  plans: GymPlan[];
  exercises: GymExercise[];
  scaling?: RoutineScaling | null;
}) {
  const [busy, start] = useTransition();
  const [planning, startPlan] = useTransition();
  const [activeDemo, setActiveDemo] = useState<GymExercise | null>(null);
  const suggested = useMemo(() => parseRoutineDefaults(scaling), [scaling]);
  const [daysPerWeek, setDaysPerWeek] = useState(String(suggested.days_per_week));
  const [sessionMinutes, setSessionMinutes] = useState(String(suggested.session_minutes));
  const [level, setLevel] = useState<GymPlanLevel>(suggested.level);
  const [knownMachineSlugs, setKnownMachineSlugs] = useState<string[]>([]);
  const [knownCustomExercises, setKnownCustomExercises] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState("");
  const [avoidTargets, setAvoidTargets] = useState<string[]>([]);
  const [knownQuery, setKnownQuery] = useState("");
  const [knownMuscle, setKnownMuscle] = useState<(typeof muscleFilters)[number]>("all");
  const [showCustomize, setShowCustomize] = useState(false);
  const machines = useMemo(
    () => exercises.filter((item) => isMachineGear(item.equipment)),
    [exercises],
  );
  const freeWeights = useMemo(
    () => exercises.filter((item) => !isMachineGear(item.equipment)),
    [exercises],
  );
  const filteredMachines = useMemo(() => {
    const q = knownQuery.trim().toLowerCase();
    return machines.filter((item) => {
      if (!matchesMuscleFilter(item.muscle_group, knownMuscle)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.muscle_group.toLowerCase().includes(q) ||
        item.equipment.toLowerCase().includes(q)
      );
    });
  }, [knownMuscle, knownQuery, machines]);
  const filteredFreeWeights = useMemo(() => {
    const q = knownQuery.trim().toLowerCase();
    return freeWeights.filter((item) => {
      if (!matchesMuscleFilter(item.muscle_group, knownMuscle)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.muscle_group.toLowerCase().includes(q) ||
        item.equipment.toLowerCase().includes(q)
      );
    });
  }, [freeWeights, knownMuscle, knownQuery]);
  const visibleKnownSlugs = useMemo(
    () => [...filteredMachines, ...filteredFreeWeights].map((item) => item.slug),
    [filteredFreeWeights, filteredMachines],
  );
  const allVisibleKnownSelected =
    visibleKnownSlugs.length > 0 &&
    visibleKnownSlugs.every((slug) => knownMachineSlugs.includes(slug));
  const someVisibleKnownSelected = visibleKnownSlugs.some((slug) =>
    knownMachineSlugs.includes(slug),
  );
  const knownSelectedCount = knownMachineSlugs.length + knownCustomExercises.length;
  const displayPlans = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        days: enrichGymPlanDays(plan.days ?? [], exercises, avoidTargets),
      })),
    [avoidTargets, exercises, plans],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLAN_PREFS_KEY);
      if (raw) {
        const saved = clampGymPlanPrefs(
          JSON.parse(raw) as {
            days_per_week?: number;
            session_minutes?: number;
            level?: GymPlanLevel;
            known_machine_slugs?: string[];
            known_custom_exercises?: string[];
            avoid_targets?: string[];
          },
        );
        setDaysPerWeek(String(saved.days_per_week));
        setSessionMinutes(String(saved.session_minutes));
        setLevel(saved.level);
        if (saved.known_machine_slugs.length) {
          setKnownMachineSlugs(saved.known_machine_slugs);
        }
        if (saved.known_custom_exercises.length) {
          setKnownCustomExercises(saved.known_custom_exercises);
        }
        if (saved.avoid_targets.length) {
          setAvoidTargets(saved.avoid_targets);
        }
      }
      const knownRaw = localStorage.getItem(KNOWN_MACHINES_KEY);
      if (knownRaw) {
        const parsed = JSON.parse(knownRaw) as unknown;
        const slugs = clampGymPlanPrefs({ known_machine_slugs: parsed as string[] }).known_machine_slugs;
        if (slugs.length) setKnownMachineSlugs(slugs);
      }
      const customRaw = localStorage.getItem(KNOWN_CUSTOM_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw) as unknown;
        const customs = clampGymPlanPrefs({
          known_custom_exercises: parsed as string[],
        }).known_custom_exercises;
        if (customs.length) setKnownCustomExercises(customs);
      }
      const avoidRaw = localStorage.getItem(AVOID_TARGETS_KEY);
      if (avoidRaw) {
        const parsed = JSON.parse(avoidRaw) as unknown;
        const targets = clampGymPlanPrefs({ avoid_targets: parsed as string[] }).avoid_targets;
        if (targets.length) setAvoidTargets(targets);
      }
    } catch {
      // ignore corrupt local prefs
    }
  }, []);

  function persistKnownMachines(next: string[]) {
    const slugs = clampGymPlanPrefs({ known_machine_slugs: next }).known_machine_slugs;
    setKnownMachineSlugs(slugs);
    try {
      localStorage.setItem(KNOWN_MACHINES_KEY, JSON.stringify(slugs));
    } catch {
      // ignore quota / private mode
    }
  }

  function persistKnownCustom(next: string[]) {
    const customs = clampGymPlanPrefs({ known_custom_exercises: next }).known_custom_exercises;
    setKnownCustomExercises(customs);
    try {
      localStorage.setItem(KNOWN_CUSTOM_KEY, JSON.stringify(customs));
    } catch {
      // ignore quota / private mode
    }
  }

  function persistAvoidTargets(next: string[]) {
    const targets = clampGymPlanPrefs({ avoid_targets: next }).avoid_targets;
    setAvoidTargets(targets);
    try {
      localStorage.setItem(AVOID_TARGETS_KEY, JSON.stringify(targets));
    } catch {
      // ignore quota / private mode
    }
  }

  function toggleKnownMachine(slug: string) {
    const next = knownMachineSlugs.includes(slug)
      ? knownMachineSlugs.filter((item) => item !== slug)
      : [...knownMachineSlugs, slug];
    persistKnownMachines(next);
  }

  function toggleSelectAllKnownInView() {
    if (allVisibleKnownSelected) {
      const hide = new Set(visibleKnownSlugs);
      persistKnownMachines(knownMachineSlugs.filter((slug) => !hide.has(slug)));
      return;
    }
    persistKnownMachines([...new Set([...knownMachineSlugs, ...visibleKnownSlugs])]);
  }

  function addCustomExercise() {
    const prefs = clampGymPlanPrefs({
      known_custom_exercises: [...knownCustomExercises, customDraft],
    });
    persistKnownCustom(prefs.known_custom_exercises);
    setCustomDraft("");
  }

  function removeCustomExercise(name: string) {
    persistKnownCustom(knownCustomExercises.filter((item) => item !== name));
  }

  function toggleAvoidTarget(target: string) {
    const next = avoidTargets.includes(target)
      ? avoidTargets.filter((item) => item !== target)
      : [...avoidTargets, target];
    persistAvoidTargets(next);
  }

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function generatePlan() {
    const prefs = clampGymPlanPrefs({
      days_per_week: Number(daysPerWeek),
      session_minutes: Number(sessionMinutes),
      level,
      known_machine_slugs: knownMachineSlugs,
      known_custom_exercises: knownCustomExercises,
      avoid_targets: avoidTargets,
    });
    setDaysPerWeek(String(prefs.days_per_week));
    setSessionMinutes(String(prefs.session_minutes));
    setLevel(prefs.level);
    persistKnownMachines(prefs.known_machine_slugs);
    persistKnownCustom(prefs.known_custom_exercises);
    persistAvoidTargets(prefs.avoid_targets);
    try {
      localStorage.setItem(PLAN_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota / private mode
    }

    startPlan(async () => {
      const result = await createAiGymPlan(prefs);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="TRAINING PROGRAM"
        title="A program that"
        highlight="fits you."
        action={
          <PrimaryButton disabled={planning} onClick={generatePlan} className="rounded-full px-5">
            <Sparkles size={14} className="shrink-0" />
            {planning ? "Creating your program…" : "Create my program"}
          </PrimaryButton>
        }
      />
      <p className="-mt-2 mb-4 text-sm leading-6 text-muted">
        Choose how often you train and your experience, then create a weekly program. Extra options are
        optional.
      </p>
      <ModuleSubNav items={trainingSubNav} />

      {displayPlans.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {displayPlans.slice(0, 4).map((plan) => {
            const today = pickTodaysPlanDay(plan.days ?? []);
            return (
              <a
                key={plan.id}
                href="#saved-programs"
                className="rounded-[1.3rem] border border-ink/8 bg-card p-4 transition hover:border-accent/30"
              >
                <p className="text-[10px] font-black tracking-wider text-accent">SAVED PROGRAM</p>
                <p className="mt-1 text-sm font-black">{plan.title}</p>
                <p className="mt-0.5 text-xs capitalize text-muted">
                  {humanizeGymLabel(plan.focus)} · {plan.level} · {plan.days_per_week} days/week
                </p>
                {today && (
                  <p className="mt-2 text-xs text-muted">
                    Today · {today.day} · {humanizeGymLabel(today.focus)}
                    {today.exercises[0] ? ` · ${today.exercises[0].name}` : ""}
                  </p>
                )}
              </a>
            );
          })}
        </div>
      )}

      <Panel title="How often do you train?" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/5 bg-card px-3 py-3">
            <label
              className="text-[10px] font-black uppercase tracking-wider text-[#948e99]"
              htmlFor="plan-days"
            >
              Days per week
            </label>
            <input
              id="plan-days"
              type="number"
              min={2}
              max={6}
              step={1}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              className={`${fieldClass} mt-1 py-2`}
            />
            {scaling && (
              <p className="mt-1 text-[10px] text-muted">Suggested {scaling.days_per_week}</p>
            )}
          </div>
          <div className="rounded-2xl border border-ink/5 bg-card px-3 py-3">
            <label
              className="text-[10px] font-black uppercase tracking-wider text-[#948e99]"
              htmlFor="plan-session"
            >
              Minutes per workout
            </label>
            <input
              id="plan-session"
              type="number"
              min={15}
              max={120}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(e.target.value)}
              className={`${fieldClass} mt-1 py-2`}
            />
            {scaling && (
              <p className="mt-1 text-[10px] text-muted">Suggested {scaling.session_minutes} min</p>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-ink/5 bg-card px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#948e99]">Experience</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Working loads use your body weight and this level.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GYM_PLAN_LEVELS.map((item) => {
              const selected = level === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLevel(item)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-black capitalize transition ${
                    selected
                      ? "border-accent/40 bg-accent-soft text-accent"
                      : "border-ink/10 bg-card text-muted hover:border-ink/20 hover:text-ink"
                  }`}
                >
                  {humanizeGymLabel(item)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrimaryButton disabled={planning} onClick={generatePlan} className="rounded-full px-5">
            <Sparkles size={14} className="shrink-0" />
            {planning ? "Creating your program…" : "Create my program"}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-accent transition hover:bg-accent-soft"
          >
            {showCustomize ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showCustomize ? "Hide optional settings" : "Customize (optional)"}
          </button>
        </div>
      </Panel>

      {showCustomize && scaling && (
        <Panel title="Your goals & fitness level" className="mb-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">{scaling.summary}</p>
                {scaling.pace_note && (
                  <p className="mt-2 text-sm leading-6 text-muted">{scaling.pace_note}</p>
                )}
              </div>
              {scaling.band_label && (
                <span className="rounded-full border border-accent/20 bg-accent-soft/70 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-accent">
                  {scaling.band_label}
                  {scaling.bmi != null ? ` · BMI ${scaling.bmi}` : ""}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink/5 bg-card px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#948e99]">Focus</p>
                <p className="mt-1 text-sm font-bold capitalize text-ink">
                  {humanizeGymLabel(scaling.focus)}
                </p>
              </div>
              <div className="rounded-2xl border border-ink/5 bg-card px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#948e99]">
                  Intensity
                </p>
                <p className="mt-1 text-sm font-bold text-ink">{scaling.intensity}</p>
              </div>
            </div>

            {(scaling.kg_to_goal != null || scaling.target_date) && (
              <p className="text-xs font-semibold text-muted">
                {scaling.kg_to_goal != null && (
                  <>
                    {Math.abs(scaling.kg_to_goal).toFixed(1)} kg to{" "}
                    {scaling.kg_to_goal > 0 ? "gain" : "lose"}
                    {scaling.goal_weight_kg != null
                      ? ` (goal ${scaling.goal_weight_kg.toFixed(1)} kg)`
                      : ""}
                  </>
                )}
                {scaling.kg_to_goal != null && scaling.target_date ? " · " : ""}
                {scaling.target_date && (
                  <>
                    target {scaling.target_date}
                    {scaling.weeks_remaining != null
                      ? ` · ${scaling.weeks_remaining} week(s) left`
                      : ""}
                    {scaling.suggested_kg_per_week != null
                      ? ` · ~${Math.abs(scaling.suggested_kg_per_week).toFixed(2)} kg/week`
                      : ""}
                  </>
                )}
              </p>
            )}

            <ul className="space-y-1.5">
              {scaling.tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-muted">
                  <Target size={14} className="mt-0.5 shrink-0 text-accent" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            {!scaling.bmi && (
              <p className="text-xs font-semibold text-[#8a6a4a]">
                Add height, weight, and a goal date in Profile → Goals so programs can match your level.
              </p>
            )}
          </div>
        </Panel>
      )}

      {showCustomize && (
      <>
      <Panel title="Skip these body areas" className="mb-4">
        <p className="mb-3 text-sm leading-6 text-muted">
          Optional: pick areas you want to skip for now (for example core). Your program will avoid them.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <span className="rounded-full bg-ember/15 px-2.5 py-1 font-black text-ember">
            {avoidTargets.length} avoided
          </span>
          {avoidTargets.length > 0 && (
            <button
              type="button"
              onClick={() => persistAvoidTargets([])}
              className="rounded-full px-2.5 py-1 transition hover:bg-surface hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {GYM_AVOID_TARGETS.map((target) => {
            const checked = avoidTargets.includes(target);
            return (
              <button
                key={target}
                type="button"
                onClick={() => toggleAvoidTarget(target)}
                aria-pressed={checked}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-black capitalize transition ${
                  checked
                    ? "border-ember/35 bg-ember/15 text-ember"
                    : "border-ink/10 bg-card text-muted hover:border-ink/20 hover:text-ink"
                }`}
              >
                {checked && <Check size={12} strokeWidth={3} />}
                {humanizeGymLabel(target)}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Moves you already know"
        className="mb-4"
        right={
          <Link
            href="/dashboard/gym/machines"
            className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[11px] font-black text-accent transition hover:bg-accent-soft"
          >
            <ExternalLink size={12} />
            Machine demos
          </Link>
        }
      >
        <p className="mb-3 text-sm leading-6 text-muted">
          Optional: mark machines and moves you know so your program can prefer them. Choices stay in this
          browser.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-black text-accent">
            {knownSelectedCount} selected
          </span>
          {visibleKnownSlugs.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAllKnownInView}
              className="rounded-full px-2.5 py-1 transition hover:bg-surface hover:text-ink"
            >
              {allVisibleKnownSelected
                ? "Clear these"
                : `Select these (${visibleKnownSlugs.length})`}
            </button>
          )}
          {knownSelectedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                persistKnownMachines([]);
                persistKnownCustom([]);
              }}
              className="rounded-full px-2.5 py-1 transition hover:bg-surface hover:text-ink"
            >
              Clear all
            </button>
          )}
          {(knownQuery.trim() || knownMuscle !== "all") && (
            <span className="text-[11px] text-muted">
              Showing {visibleKnownSlugs.length}
              {someVisibleKnownSelected
                ? ` · ${visibleKnownSlugs.filter((slug) => knownMachineSlugs.includes(slug)).length} checked`
                : ""}
            </span>
          )}
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-2xl border border-ink/8 bg-card px-3 py-2.5">
          <Search size={14} className="shrink-0 text-muted" />
          <input
            value={knownQuery}
            onChange={(e) => setKnownQuery(e.target.value)}
            placeholder="Search exercises…"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
            aria-label="Search exercises you know"
          />
          {knownQuery && (
            <button
              type="button"
              onClick={() => setKnownQuery("")}
              className="grid size-6 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
              aria-label="Clear search"
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </label>

        <FilterChipRow>
          {muscleFilters.map((item) => (
            <FilterChip
              key={item}
              active={knownMuscle === item}
              onClick={() => setKnownMuscle(item)}
            >
              {muscleFilterLabel(item)}
            </FilterChip>
          ))}
        </FilterChipRow>

        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
          Machines ({filteredMachines.length})
        </p>
        <div className="mb-4 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMachines.map((machine) => {
            const checked = knownMachineSlugs.includes(machine.slug);
            return (
              <div
                key={machine.id}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${
                  checked
                    ? "border-accent/30 bg-accent-soft/50"
                    : "border-ink/8 bg-card hover:border-ink/15"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleKnownMachine(machine.slug)}
                  className={`grid size-6 shrink-0 place-items-center rounded-md border transition ${
                    checked
                      ? "border-accent bg-accent text-inverse-fg"
                      : "border-ink/15 bg-panel text-transparent"
                  }`}
                  aria-pressed={checked}
                  aria-label={`${checked ? "Unmark" : "Mark"} ${machine.name} as known`}
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleKnownMachine(machine.slug)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <KnownExerciseThumb exercise={machine} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{machine.name}</p>
                    <p className="truncate text-[10px] capitalize text-muted">
                      {humanizeGymLabel(machine.muscle_group)} · {humanizeGymLabel(machine.equipment)}
                    </p>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemo(machine)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-inverse px-2.5 py-1.5 text-[10px] font-black text-inverse-fg transition hover:bg-accent"
                  aria-label={`Watch ${machine.name} demo`}
                >
                  <Play size={10} fill="currentColor" />
                  Demo
                </button>
              </div>
            );
          })}
          {!filteredMachines.length && (
            <EmptyState>
              {machines.length
                ? "No machines match this search."
                : "No machines listed yet."}
            </EmptyState>
          )}
        </div>

        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
          Free weights &amp; bodyweight ({filteredFreeWeights.length})
        </p>
        <div className="mb-4 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFreeWeights.map((move) => {
            const checked = knownMachineSlugs.includes(move.slug);
            return (
              <div
                key={move.id}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${
                  checked
                    ? "border-accent/30 bg-accent-soft/50"
                    : "border-ink/8 bg-card hover:border-ink/15"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleKnownMachine(move.slug)}
                  className={`grid size-6 shrink-0 place-items-center rounded-md border transition ${
                    checked
                      ? "border-accent bg-accent text-inverse-fg"
                      : "border-ink/15 bg-panel text-transparent"
                  }`}
                  aria-pressed={checked}
                  aria-label={`${checked ? "Unmark" : "Mark"} ${move.name} as known`}
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleKnownMachine(move.slug)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <KnownExerciseThumb exercise={move} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{move.name}</p>
                    <p className="truncate text-[10px] capitalize text-muted">
                      {humanizeGymLabel(move.muscle_group)} · {humanizeGymLabel(move.equipment)}
                    </p>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemo(move)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-inverse px-2.5 py-1.5 text-[10px] font-black text-inverse-fg transition hover:bg-accent"
                  aria-label={`Watch ${move.name} demo`}
                >
                  <Play size={10} fill="currentColor" />
                  Demo
                </button>
              </div>
            );
          })}
          {!filteredFreeWeights.length && (
            <EmptyState>
              {freeWeights.length
                ? "No free-weight moves match this search."
                : "No free-weight moves listed yet."}
            </EmptyState>
          )}
        </div>

        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">Other</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-xs font-bold text-muted">
            Add a move not listed
            <input
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomExercise();
                }
              }}
              placeholder="e.g. Hip thrust, landmine press…"
              className={`${fieldClass} mt-1.5`}
              maxLength={80}
            />
          </label>
          <PrimaryButton
            type="button"
            disabled={customDraft.trim().length < 2}
            onClick={addCustomExercise}
            className="rounded-full px-5"
          >
            Add
          </PrimaryButton>
        </div>
        {knownCustomExercises.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {knownCustomExercises.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft/60 px-3 py-1.5 text-[11px] font-black text-accent"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeCustomExercise(name)}
                  className="grid size-4 place-items-center rounded-full text-accent transition hover:bg-accent hover:text-inverse-fg"
                  aria-label={`Remove ${name}`}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Panel>
      </>
      )}

      <Panel
        id="saved-programs"
        title="Your saved programs"
        right={displayPlans.length > 0 ? <ShareExportMenu compact doc={gymPlansDoc(displayPlans)} /> : undefined}
      >
        <div className="space-y-4">
          {displayPlans.map((plan) => (
            <article key={plan.id} className="rounded-[1.3rem] border border-ink/8 bg-surface/45 p-4">
              <div>
                <p className="text-sm font-black">{plan.title}</p>
                <p className="mt-1 text-xs capitalize text-muted">
                  {humanizeGymLabel(plan.focus)} · {plan.level} · {plan.days_per_week} days/week
                </p>
                {plan.summary && <p className="mt-2 text-sm leading-6 text-muted">{plan.summary}</p>}
                {(plan.recommendations ?? []).length > 0 && (
                  <div className="mt-3 rounded-2xl border border-accent/15 bg-accent-soft/40 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                      Coach notes
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {(plan.recommendations ?? []).map((rec) => (
                        <li key={rec} className="flex gap-2 text-sm leading-5 text-muted">
                          <Lightbulb size={14} className="mt-0.5 shrink-0 text-accent" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ShareExportMenu compact doc={gymPlanDoc(plan)} />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => deleteGymPlan(plan.id))}
                    aria-label={`Delete ${plan.title}`}
                    className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-ember/15 hover:text-ember"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(plan.days ?? []).map((day) => (
                  <div key={`${plan.id}-${day.day}`} className="rounded-2xl border border-ink/5 bg-panel/80 p-3">
                    <p className="text-xs font-black text-accent">{day.day}</p>
                    <p className="mt-1 text-sm font-bold capitalize">{humanizeGymLabel(day.focus)}</p>
                    <ul className="mt-2 space-y-2">
                      {(day.exercises ?? []).map((ex) => {
                        const linked = findExerciseMatch(ex.name, exercises);
                        return (
                          <li key={`${day.day}-${ex.name}`} className="text-xs text-muted">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                {linked && (
                                  <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-surface-soft ring-1 ring-ink/8">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={linked.demo_thumbnail_url ?? "/vivrant-mark.png"}
                                      alt=""
                                      className="size-full object-cover"
                                      loading="lazy"
                                    />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-ink">{ex.name}</p>
                                  <p>
                                    {[ex.sets, ex.weight, `rest ${ex.rest}`]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                  {ex.notes && (
                                    <p className="mt-0.5 text-[11px] leading-4 text-muted/90">{ex.notes}</p>
                                  )}
                                </div>
                              </div>
                              {linked && (
                                <button
                                  type="button"
                                  onClick={() => setActiveDemo(linked)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-black text-accent transition hover:bg-accent hover:text-inverse-fg"
                                  aria-label={`Watch ${ex.name} demo`}
                                >
                                  <Play size={10} fill="currentColor" />
                                  Demo
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {(day.alternatives ?? []).length > 0 && (
                      <div className="mt-3 border-t border-ink/8 pt-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                          Alternatives
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {day.alternatives?.map((swap) => (
                            <li
                              key={`${day.day}-alt-${swap.instead_of}-${swap.use}`}
                              className="flex gap-1.5 text-[11px] leading-4 text-muted"
                            >
                              <Repeat2 size={12} className="mt-0.5 shrink-0 text-accent" />
                              <span>
                                <span className="font-bold text-ink">{swap.use}</span>
                                {" "}instead of {swap.instead_of}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(day.additionals ?? []).length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                          Add to this workout
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {day.additionals?.map((addon) => (
                            <li
                              key={`${day.day}-add-${addon.name}`}
                              className="flex gap-1.5 text-[11px] leading-4 text-muted"
                            >
                              <Plus size={12} className="mt-0.5 shrink-0 text-accent" />
                              <span>
                                <span className="font-bold text-ink">{addon.name}</span>
                                {addon.sets ? ` · ${addon.sets}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(plan.days ?? []).some(
                (day) => (day.alternatives ?? []).length > 0 || (day.additionals ?? []).length > 0,
              ) && (
                <div className="mt-4 rounded-2xl border border-accent/15 bg-accent-soft/40 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-accent">
                    Suggestions to add
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    If a machine is busy or you have extra minutes, use these swaps and extras.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(plan.days ?? []).map((day) => {
                      const swaps = day.alternatives ?? [];
                      const extras = day.additionals ?? [];
                      if (!swaps.length && !extras.length) return null;
                      return (
                        <li key={`${plan.id}-suggest-${day.day}`} className="text-sm leading-5 text-muted">
                          <span className="font-black text-ink">{day.day}:</span>{" "}
                          {[
                            ...swaps.map((swap) => `${swap.use} instead of ${swap.instead_of}`),
                            ...extras.map((addon) => `add ${addon.name}${addon.sets ? ` (${addon.sets})` : ""}`),
                          ].join(" · ")}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </article>
          ))}
          {!plans.length && (
            <EmptyState>
              No program yet — choose how often you train above, then tap Create my program.
            </EmptyState>
          )}
        </div>
      </Panel>
      <AnimatePresence>
        {activeDemo && <DemoModal exercise={activeDemo} onClose={() => setActiveDemo(null)} />}
      </AnimatePresence>
    </>
  );
}
