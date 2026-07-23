"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Apple,
  Camera,
  Droplets,
  Flame,
  Hand,
  ImagePlus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { addWaterIntake, deleteMeal, logMeal } from "@/app/dashboard/nutrition/actions";
import { estimateMealWithAi } from "@/app/dashboard/nutrition/ai-actions";
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
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Meal = {
  id: number;
  meal_name: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
};

type PortionSize = "small" | "typical" | "large";

type QuickMeal = {
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  hint: string;
};

const nutritionSubNav = [
  { href: "/dashboard/nutrition", label: "Overview" },
  { href: "/dashboard/nutrition/log", label: "Log meal" },
] as const;

const PORTION_SCALE: Record<PortionSize, number> = {
  small: 0.75,
  typical: 1,
  large: 1.35,
};

/** Ready-made estimates so users never need a scale or label. */
const QUICK_MEALS: QuickMeal[] = [
  {
    name: "Eggs & toast",
    meal_type: "breakfast",
    calories: 350,
    protein_g: 18,
    carbs_g: 30,
    fat_g: 16,
    hint: "2 eggs + 1–2 toast",
  },
  {
    name: "Oatmeal & fruit",
    meal_type: "breakfast",
    calories: 320,
    protein_g: 10,
    carbs_g: 55,
    fat_g: 6,
    hint: "1 bowl",
  },
  {
    name: "Chicken rice bowl",
    meal_type: "lunch",
    calories: 550,
    protein_g: 35,
    carbs_g: 55,
    fat_g: 15,
    hint: "palm protein + fist rice",
  },
  {
    name: "Salad with protein",
    meal_type: "lunch",
    calories: 380,
    protein_g: 30,
    carbs_g: 18,
    fat_g: 18,
    hint: "big bowl + chicken/tofu",
  },
  {
    name: "Fish & veggies",
    meal_type: "dinner",
    calories: 420,
    protein_g: 32,
    carbs_g: 20,
    fat_g: 18,
    hint: "palm fish + veggies",
  },
  {
    name: "Protein snack",
    meal_type: "snack",
    calories: 200,
    protein_g: 15,
    carbs_g: 12,
    fat_g: 8,
    hint: "yogurt, shake, or nuts",
  },
];

const WATER_PRESETS = [
  { label: "+1 glass", amount_ml: 250, detail: "250 ml" },
  { label: "+1 bottle", amount_ml: 500, detail: "500 ml" },
  { label: "+1 big bottle", amount_ml: 750, detail: "750 ml" },
] as const;

function scaleMacros(meal: QuickMeal, portion: PortionSize) {
  const scale = PORTION_SCALE[portion];
  return {
    calories: Math.round(meal.calories * scale),
    protein_g: Math.round(meal.protein_g * scale * 10) / 10,
    carbs_g: Math.round(meal.carbs_g * scale * 10) / 10,
    fat_g: Math.round(meal.fat_g * scale * 10) / 10,
  };
}

export function NutritionView({
  meals,
  waterMl = 0,
  waterGoalMl = 2400,
  mode = "overview",
}: {
  meals: Meal[];
  waterMl?: number;
  waterGoalMl?: number;
  mode?: "overview" | "log";
}) {
  const { pending, submit } = useModuleAction(logMeal);
  const photoRef = useRef<HTMLInputElement>(null);
  const [deleting, startDelete] = useTransition();
  const [estimating, startEstimate] = useTransition();
  const [addingWater, startWater] = useTransition();
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [description, setDescription] = useState("");
  const [portion, setPortion] = useState<PortionSize>("typical");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const [estimateSource, setEstimateSource] = useState<"ai" | "quick" | null>(null);
  const [selectedQuick, setSelectedQuick] = useState<QuickMeal | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_g ?? 0), 0);
  const waterLiters = waterMl / 1000;
  const waterGoal = waterGoalMl / 1000;
  const proteinGoal = 80;
  const calorieGoal = 2000;
  const dietScore = Math.min(
    100,
    Math.round(
      (Math.min(totalProtein, proteinGoal) / proteinGoal) * 45 +
        (Math.min(totalCalories, calorieGoal) / calorieGoal) * 35 +
        (meals.length > 0 ? 20 : 0),
    ),
  );

  function applyMacros(next: {
    meal_name?: string;
    meal_type?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) {
    if (next.meal_name) setMealName(next.meal_name);
    if (next.meal_type) setMealType(next.meal_type);
    setCalories(String(next.calories));
    setProtein(String(next.protein_g));
    setCarbs(String(next.carbs_g));
    setFat(String(next.fat_g));
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (photoRef.current) photoRef.current.value = "";
  }

  function onPhotoChange(file: File | undefined) {
    if (!file) return;
    clearPhoto();
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function pickQuickMeal(meal: QuickMeal, nextPortion = portion, announce = true) {
    const scaled = scaleMacros(meal, nextPortion);
    applyMacros({
      meal_name: meal.name,
      meal_type: meal.meal_type,
      ...scaled,
    });
    setSelectedQuick(meal);
    setDescription("");
    setTip(
      `${meal.hint}. Numbers are rough averages for a ${nextPortion} portion — close enough for daily tracking.`,
    );
    setEstimateSource("quick");
    if (announce) toast.success("Approx macros filled — review and log.");
  }

  function choosePortion(next: PortionSize) {
    setPortion(next);
    if (selectedQuick && estimateSource === "quick") {
      pickQuickMeal(selectedQuick, next, false);
    }
  }

  function estimate() {
    startEstimate(async () => {
      if (!description.trim() && !photoFile) {
        toast.error("Describe the meal, attach a photo, or pick a quick meal.");
        return;
      }
      const formData = new FormData();
      if (description.trim()) formData.set("description", description.trim());
      if (photoFile) formData.set("photo", photoFile);
      formData.set("portion", portion);

      const result = await estimateMealWithAi(formData);
      if (!result.ok || !("estimate" in result) || !result.estimate) {
        toast.error(result.message);
        return;
      }
      const { estimate: e } = result;
      applyMacros(e);
      setTip(e.tip);
      setSelectedQuick(null);
      setEstimateSource("ai");
      toast.success(result.message);
    });
  }

  function logWater(amount_ml: number) {
    startWater(async () => {
      const formData = new FormData();
      formData.set("amount_ml", String(amount_ml));
      const result = await addWaterIntake(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="NUTRITION"
        title={mode === "log" ? "Log with" : "Eat with"}
        highlight="intention."
      />
      <ModuleSubNav items={nutritionSubNav} />

      {mode === "log" && (
        <>
          <Panel title="No scale needed" className="mb-4" right={<Hand size={16} className="text-accent" />}>
            <p className="text-sm leading-6 text-[#4a5a52]">
              You don’t need exact numbers. Pick a quick meal, describe what you ate, or snap a
              photo — we fill approximate calories and protein for you. Trends matter more than
              perfect grams.
            </p>
            <ul className="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-3">
              <li className="rounded-xl bg-surface/70 px-3 py-2">
                <span className="font-black text-accent">Palm</span> ≈ protein serving
              </li>
              <li className="rounded-xl bg-surface/70 px-3 py-2">
                <span className="font-black text-accent">Fist</span> ≈ carbs / rice / pasta
              </li>
              <li className="rounded-xl bg-surface/70 px-3 py-2">
                <span className="font-black text-accent">Thumb</span> ≈ fats / oils / nuts
              </li>
            </ul>
          </Panel>

          <Panel title="1. Portion size" className="mb-4">
            <p className="mb-3 text-xs text-muted">
              Compared to your usual plate — this scales quick picks and AI estimates.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["small", "Small / light"],
                  ["typical", "Typical"],
                  ["large", "Large / generous"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => choosePortion(value)}
                  className={`focus-ring rounded-xl border px-3.5 py-2.5 text-xs font-black transition ${
                    portion === value
                      ? "border-accent/35 bg-accent text-white"
                      : "border-ink/10 bg-surface/70 text-accent hover:bg-panel"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="2. Quick meals" className="mb-4">
            <p className="mb-3 text-xs text-muted">
              One tap fills rough macros. No weighing, no labels.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {QUICK_MEALS.map((meal) => (
                <button
                  key={meal.name}
                  type="button"
                  onClick={() => pickQuickMeal(meal)}
                  className="focus-ring rounded-2xl border border-ink/8 bg-card/80 px-3.5 py-3 text-left transition hover:border-accent/25 hover:bg-panel"
                >
                  <span className="block text-sm font-black text-ink">{meal.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">{meal.hint}</span>
                  <span className="mt-2 block text-[11px] font-bold text-accent">
                    ~{scaleMacros(meal, portion).calories} kcal · ~
                    {scaleMacros(meal, portion).protein_g}g protein
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title="3. Or describe / photo"
            className="mb-4"
            right={<Sparkles size={16} className="text-accent" />}
          >
            <div className="space-y-3">
              <FormField label="What did you eat?" hint="Plain language is enough">
                <input
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="e.g. grilled chicken, brown rice, and mango"
                  className={fieldClass}
                />
              </FormField>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => onPhotoChange(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-2.5 text-xs font-black text-accent transition hover:bg-panel"
                >
                  <ImagePlus size={15} />
                  {photoFile ? "Change photo" : "Attach meal photo"}
                </button>
                {photoPreview && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Meal preview"
                      className="size-14 rounded-xl border border-ink/8 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-inverse text-inverse-fg"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <PrimaryButton
                  type="button"
                  disabled={estimating}
                  onClick={estimate}
                  className="ml-auto"
                >
                  <Camera size={14} className="shrink-0" />
                  {estimating ? "Estimating…" : "Estimate for me"}
                </PrimaryButton>
              </div>

              <p className="text-xs leading-5 text-muted">
                AI returns approximate macros for your {portion} portion. Review below, then log.
              </p>
              {tip && <p className="text-sm font-semibold text-accent">{tip}</p>}
            </div>
          </Panel>

          <Panel
            title="4. Review & log"
            className="mb-4"
            right={
              estimateSource ? (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-accent">
                  {estimateSource === "ai" ? "AI estimate" : "Quick estimate"}
                </span>
              ) : null
            }
          >
            <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <FormField label="Meal" hint="Required" className="sm:col-span-2">
                <input
                  name="meal_name"
                  required
                  value={mealName}
                  onChange={(event) => setMealName(event.target.value)}
                  placeholder="e.g. Chicken rice bowl"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Meal type">
                <select
                  name="meal_type"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                  className={fieldClass}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </FormField>
              <FormField label="Calories" hint="approx kcal">
                <input
                  name="calories"
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(event) => setCalories(event.target.value)}
                  placeholder="auto"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Protein" hint="approx g">
                <input
                  name="protein_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                  placeholder="auto"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Carbs" hint="approx g">
                <input
                  name="carbs_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={carbs}
                  onChange={(event) => setCarbs(event.target.value)}
                  placeholder="auto"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Fat" hint="approx g">
                <input
                  name="fat_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                  placeholder="auto"
                  className={fieldClass}
                />
              </FormField>
              <p className="text-xs leading-5 text-muted sm:col-span-2 lg:col-span-6">
                Leave macros blank only if you just want the meal name on your log. Prefer a quick
                meal or estimate so your daily totals stay useful.
              </p>
              <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-6">
                {pending ? "Saving…" : "Log meal"}
              </PrimaryButton>
            </form>
          </Panel>
        </>
      )}

      {mode === "overview" && (
        <Stagger>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Calories today"
              value={String(totalCalories)}
              detail={`${meals.length} meals · ${Math.round(totalProtein)}g protein`}
              icon={Flame}
              className="bg-gradient-to-br from-accent-deep to-accent text-white"
            />
            <StatCard
              label="Water"
              value={waterLiters.toFixed(1)}
              suffix={`/ ${waterGoal}L`}
              detail={
                waterMl >= waterGoal * 1000
                  ? "Goal reached"
                  : `${Math.max(0, Math.round(waterGoal * 1000 - waterMl))} ml to go`
              }
              icon={Droplets}
              className="bg-accent-soft text-accent-deep"
            />
            <StatCard
              label="Diet quality"
              value={`${dietScore}%`}
              detail={meals.length ? "Based on today’s logs" : "Log a meal to score"}
              icon={Apple}
              className="bg-ember/10 text-ember"
            />
          </div>

          <Panel
            title="Log water"
            className="mt-4"
            right={<Droplets size={16} className="text-accent" />}
          >
            <p className="mb-3 text-xs leading-5 text-muted">
              Tap a glass or bottle — no need to measure milliliters yourself.
            </p>
            <div className="flex flex-wrap gap-2">
              {WATER_PRESETS.map((preset) => (
                <button
                  key={preset.amount_ml}
                  type="button"
                  disabled={addingWater}
                  onClick={() => logWater(preset.amount_ml)}
                  className="focus-ring rounded-xl border border-ink/10 bg-accent-soft px-3.5 py-2.5 text-xs font-black text-accent-deep transition hover:bg-panel disabled:opacity-60"
                >
                  {preset.label}
                  <span className="ml-1.5 font-semibold text-muted">{preset.detail}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Logged meals" className="mt-4">
            <div className="space-y-2">
              {meals.map((meal) => (
                <ListRow
                  key={meal.id}
                  title={meal.meal_name}
                  meta={meal.meal_type}
                  right={
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-black">~{meal.calories ?? 0} kcal</span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() =>
                          startDelete(async () => {
                            const result = await deleteMeal(meal.id);
                            if (result.ok) toast.success(result.message);
                            else toast.error(result.message);
                          })
                        }
                        className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
                        aria-label={`Delete ${meal.meal_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  }
                />
              ))}
              {!meals.length && (
                <EmptyState>
                  No meals yet.{" "}
                  <Link href="/dashboard/nutrition/log" className="font-black text-accent underline-offset-2 hover:underline">
                    Log your first meal
                  </Link>{" "}
                  — type food or use a photo. No scale needed.
                </EmptyState>
              )}
            </div>
          </Panel>
        </Stagger>
      )}
    </>
  );
}
