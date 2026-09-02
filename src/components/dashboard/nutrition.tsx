"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Apple,
  Camera,
  Droplets,
  Flame,
  ImagePlus,
  Sparkles,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  archiveSelected,
  BulkBar,
  SelectableRow,
  SelectCheck,
  SelectModeButton,
  useBulkSelect,
} from "@/components/dashboard/bulk-select";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import { deleteMeal, logMeal, updateMeal } from "@/app/dashboard/nutrition/actions";
import {
  estimateMealWithAi,
  suggestMealWithAi,
} from "@/app/dashboard/nutrition/ai-actions";
import {
  EmptyState,
  FormField,
  ListRow,
  ModuleJumpLinks,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { mealsDoc } from "@/lib/share-export";
import {
  nextMealSuggestions,
  QUICK_MEALS,
  scaleMacros,
  suggestedMealType,
  type PortionSize,
  type QuickMeal,
} from "@/lib/nutrition/suggestions";

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

const nutritionSubNav = [
  { href: "/dashboard/nutrition", label: "Overview" },
  { href: "/dashboard/nutrition/log", label: "Log meal" },
  { href: "/dashboard/nutrition/sheet", label: "Sheet" },
] as const;

type PantryChip = {
  id: number;
  name: string;
  stock_level: number;
  category: string;
};

export function NutritionView({
  meals,
  waterMl = 0,
  waterGoalMl = 2400,
  mode = "overview",
  autoSuggest = false,
  pantryItems = [],
}: {
  meals: Meal[];
  waterMl?: number;
  waterGoalMl?: number;
  mode?: "overview" | "log";
  autoSuggest?: boolean;
  pantryItems?: PantryChip[];
}) {
  const { pending, submit } = useModuleAction(logMeal);
  const photoRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const autoSuggestRan = useRef(false);
  const [deleting, startDelete] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [estimating, startEstimate] = useTransition();
  const [suggesting, startSuggest] = useTransition();
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [description, setDescription] = useState("");
  const [portion, setPortion] = useState<PortionSize>("typical");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [estimateSource, setEstimateSource] = useState<"ai" | "quick" | "suggest" | null>(null);
  const [selectedQuick, setSelectedQuick] = useState<QuickMeal | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const bulk = useBulkSelect(meals.map((meal) => meal.id));

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_g ?? 0), 0);
  const waterLiters = waterMl / 1000;
  const waterGoal = waterGoalMl / 1000;
  const proteinGoal = 80;
  const calorieGoal = 2000;
  const nextSuggestions = nextMealSuggestions(meals.map((meal) => meal.meal_type));
  const nextSlot = suggestedMealType();
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
    setReason(null);
    if (announce) toast.success("Approx macros filled — review and log.");
  }

  function quickLog(meal: QuickMeal) {
    const scaled = scaleMacros(meal, "typical");
    const fd = new FormData();
    fd.set("meal_name", meal.name);
    fd.set("meal_type", meal.meal_type);
    fd.set("calories", String(scaled.calories));
    fd.set("protein_g", String(scaled.protein_g));
    fd.set("carbs_g", String(scaled.carbs_g));
    fd.set("fat_g", String(scaled.fat_g));
    submit(fd);
  }

  function choosePortion(next: PortionSize) {
    setPortion(next);
    if (selectedQuick && estimateSource === "quick") {
      pickQuickMeal(selectedQuick, next, false);
    }
  }

  function suggestMealIdea() {
    startSuggest(async () => {
      const result = await suggestMealWithAi();
      if (!result.ok || !("suggestion" in result) || !result.suggestion) {
        toast.error(result.message);
        return;
      }
      const s = result.suggestion;
      applyMacros(s);
      setDescription("");
      clearPhoto();
      setSelectedQuick(null);
      setReason(s.reason);
      setTip(s.tip);
      setEstimateSource("suggest");
      toast.success(result.message);
      requestAnimationFrame(() => {
        reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  useEffect(() => {
    if (mode !== "log" || !autoSuggest) return;
    if (autoSuggestRan.current) return;
    autoSuggestRan.current = true;
    suggestMealIdea();
    // Intentionally once on first mount when overview deep-links with ?suggest=1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoSuggest]);

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
      setReason(null);
      setSelectedQuick(null);
      setEstimateSource("ai");
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="NUTRITION"
        title={mode === "log" ? "Log with" : "Eat with"}
        highlight="intention."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {meals.length > 0 && <ShareExportMenu compact doc={mealsDoc(meals)} />}
            <Link
              href="/dashboard/nutrition/sheet"
              className="inline-flex items-center rounded-full border border-ink/12 bg-panel/70 px-4 py-2.5 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              Sheet view
            </Link>
            {mode === "log" ? (
              <PrimaryButton
                type="button"
                disabled={suggesting}
                onClick={suggestMealIdea}
                className="rounded-full px-5"
              >
                <Sparkles size={14} className="shrink-0" />
                {suggesting ? "Planning…" : "Suggest meal"}
              </PrimaryButton>
            ) : (
              <Link
                href="/dashboard/nutrition/log?suggest=1"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-inverse px-4 py-2.5 text-xs font-black text-inverse-fg shadow-[0_8px_18px_rgba(var(--shadow-color),.16)] transition hover:-translate-y-0.5 hover:bg-accent"
              >
                <Sparkles size={14} className="shrink-0" />
                Suggest meal
              </Link>
            )}
          </div>
        }
      />
      <ModuleSubNav items={nutritionSubNav} />
      {mode === "overview" && (
        <ModuleJumpLinks
          items={[
            { href: "/dashboard/nutrition/log", title: "Log a meal", icon: Apple },
            { href: "/dashboard/nutrition/sheet", title: "Sheet view", icon: Flame },
            { href: "/dashboard/hydration", title: "Log water", icon: Droplets },
          ]}
        />
      )}

      {mode === "log" && (
        <p className="-mt-2 mb-8 max-w-xl text-sm leading-6 text-muted">
          No scale needed. Pick a quick meal, describe what you ate, or add a photo — approximate
          macros are enough.
        </p>
      )}

      {mode === "log" && (
        <>
          {(reason || (tip && estimateSource === "suggest")) && (
            <div className="mb-4 rounded-2xl border border-accent/25 bg-surface px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.16em] text-accent uppercase">
                <Sparkles size={12} />
                Suggested for you
              </p>
              {reason ? (
                <p className="mt-1.5 text-sm font-semibold leading-6 text-ink">
                  {reason}
                </p>
              ) : null}
              {tip && estimateSource === "suggest" ? (
                <p className="mt-1 text-xs leading-5 text-muted">{tip}</p>
              ) : null}
            </div>
          )}

          {pantryItems.length > 0 && (
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold text-muted">Used something from the pantry?</p>
              <div className="flex flex-wrap gap-2">
                {pantryItems
                  .filter((item) => item.stock_level > 0)
                  .slice(0, 10)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMealName(item.name);
                        setDescription((prev) =>
                          prev.includes(item.name) ? prev : [prev, item.name].filter(Boolean).join(", "),
                        );
                        toast.success(`Using ${item.name} from pantry`);
                      }}
                      className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-bold text-muted transition hover:border-accent/30 hover:text-accent"
                    >
                      {item.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <p className="mb-8 text-xs leading-5 text-muted">
            <span className="font-black text-accent">Palm</span> ≈ protein ·{" "}
            <span className="font-black text-accent">Fist</span> ≈ carbs ·{" "}
            <span className="font-black text-accent">Thumb</span> ≈ fats
          </p>

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
                      ? "border-accent/35 bg-accent text-accent-fg"
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
              {tip && estimateSource === "ai" && (
                <p className="text-sm font-semibold text-accent">{tip}</p>
              )}
            </div>
          </Panel>

          <div ref={reviewRef}>
            <Panel
              title="4. Review & log"
              className="mb-4"
              right={
                estimateSource ? (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-accent">
                    {estimateSource === "ai"
                      ? "AI estimate"
                      : estimateSource === "suggest"
                        ? "AI suggestion"
                        : "Quick estimate"}
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
                  {estimateSource === "suggest"
                    ? "Suggestion filled from your pantry and today’s logs — tweak anything, then log."
                    : "Leave macros blank only if you just want the meal name on your log. Prefer a quick meal, suggestion, or estimate so your daily totals stay useful."}
                </p>
                <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-6">
                  {pending ? "Saving…" : "Log meal"}
                </PrimaryButton>
              </form>
            </Panel>
          </div>
        </>
      )}

      {mode === "overview" && (
        <Stagger>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Calories today"
              value={String(totalCalories)}
              detail={`${Math.max(0, calorieGoal - totalCalories)} left of ${calorieGoal} · ${Math.round(totalProtein)}g protein`}
              icon={Flame}
              tone="brand"
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
              tone="soft"
            />
            <StatCard
              label="Diet quality"
              value={`${dietScore}%`}
              detail={meals.length ? "Based on today’s logs" : "Log a meal to score"}
              icon={Apple}
              tone="warn"
            />
          </div>

          <Panel
            title={`Suggested ${nextSlot}`}
            className="mt-4"
            right={
              <Link
                href="/dashboard/nutrition/log?suggest=1"
                className="inline-flex items-center gap-1 text-[11px] font-black text-accent"
              >
                <Sparkles size={12} />
                AI meal idea
              </Link>
            }
          >
            <p className="mb-3 text-xs text-muted">
              One tap logs a typical portion. Open log meal to tweak size, pantry, or a photo.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {nextSuggestions.map((meal) => {
                const scaled = scaleMacros(meal, "typical");
                return (
                  <button
                    key={meal.name}
                    type="button"
                    disabled={pending}
                    onClick={() => quickLog(meal)}
                    className="focus-ring rounded-2xl border border-ink/8 bg-card/80 px-3.5 py-3 text-left transition hover:border-accent/25 hover:bg-panel"
                  >
                    <span className="block text-sm font-black text-ink">{meal.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{meal.hint}</span>
                    <span className="mt-2 block text-[11px] font-bold text-accent">
                      ~{scaled.calories} kcal · ~{scaled.protein_g}g protein
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Logged meals"
            className="mt-8"
            right={
              meals.length > 0 ? (
                <div className="flex items-center gap-3">
                  <ShareExportMenu compact doc={mealsDoc(meals)} />
                  <SelectModeButton
                    selecting={bulk.selecting}
                    onStart={bulk.start}
                    onCancel={bulk.clear}
                  />
                </div>
              ) : undefined
            }
          >
            <BulkBar
              selecting={bulk.selecting}
              count={bulk.count}
              total={meals.length}
              allSelected={bulk.allSelected}
              onSelectAll={bulk.allSelected ? bulk.deselectAll : bulk.selectAll}
              onClear={bulk.clear}
              pending={deleting}
              onConfirm={() =>
                startDelete(async () => {
                  const ok = await archiveSelected("nutrition_logs", bulk.selectedIds);
                  if (ok) bulk.clear();
                })
              }
            />
            <div className="space-y-2">
              {meals.map((meal) => (
                editingId === meal.id ? (
                  <form
                    key={meal.id}
                    className="grid gap-2 rounded-2xl border border-accent/20 bg-accent-soft/40 p-3 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      formData.set("id", String(meal.id));
                      startDelete(async () => {
                        const result = await updateMeal(formData);
                        if (result.ok) {
                          toast.success(result.message);
                          setEditingId(null);
                        } else toast.error(result.message);
                      });
                    }}
                  >
                    <input name="meal_name" defaultValue={meal.meal_name} required className={fieldClass} />
                    <select name="meal_type" defaultValue={meal.meal_type} className={fieldClass}>
                      {["breakfast", "lunch", "dinner", "snack"].map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <input name="calories" type="number" min={0} defaultValue={meal.calories ?? ""} placeholder="kcal" className={fieldClass} />
                    <input name="protein_g" type="number" min={0} step="0.1" defaultValue={meal.protein_g ?? ""} placeholder="protein g" className={fieldClass} />
                    <input name="carbs_g" type="number" min={0} step="0.1" defaultValue={meal.carbs_g ?? ""} placeholder="carbs g" className={fieldClass} />
                    <input name="fat_g" type="number" min={0} step="0.1" defaultValue={meal.fat_g ?? ""} placeholder="fat g" className={fieldClass} />
                    <div className="flex gap-2 sm:col-span-2">
                      <PrimaryButton disabled={deleting} className="rounded-full px-4">{deleting ? "Saving…" : "Save"}</PrimaryButton>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs font-black text-muted">Cancel</button>
                    </div>
                  </form>
                ) : (
                <SelectableRow
                  key={meal.id}
                  id={meal.id}
                  label={meal.meal_name}
                  selecting={bulk.selecting}
                  selected={bulk.selected.has(meal.id)}
                  onToggle={bulk.toggle}
                  onArchive={async () => {
                    if (!(await confirmDelete(meal.meal_name))) return;
                    startDelete(async () => {
                      const result = await deleteMeal(meal.id);
                      if (result.ok) toast.success(result.message);
                      else toast.error(result.message);
                      if (editingId === meal.id) setEditingId(null);
                    });
                  }}
                >
                <ListRow
                  title={meal.meal_name}
                  meta={meal.meal_type}
                  selected={bulk.selecting && bulk.selected.has(meal.id)}
                  left={bulk.selecting ? <SelectCheck checked={bulk.selected.has(meal.id)} /> : undefined}
                  right={
                    bulk.selecting ? (
                      <span className="text-xs font-black">~{meal.calories ?? 0} kcal</span>
                    ) : (
                    <span className="flex items-center gap-1">
                      <span className="text-xs font-black">~{meal.calories ?? 0} kcal</span>
                      <button
                        type="button"
                        onClick={() => setEditingId(meal.id)}
                        className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent/15 hover:text-accent"
                        aria-label={`Edit ${meal.meal_name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() =>
                          startDelete(async () => {
                            if (!(await confirmDelete("this meal"))) return;
                            const result = await deleteMeal(meal.id);
                            if (result.ok) toast.success(result.message);
                            else toast.error(result.message);
                            if (editingId === meal.id) setEditingId(null);
                          })
                        }
                        className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
                        aria-label={`Delete ${meal.meal_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                    )
                  }
                />
                </SelectableRow>
                )
              ))}
              {!meals.length && (
                <EmptyState>
                  No meals yet.{" "}
                  <Link href="/dashboard/nutrition/log" className="font-black text-accent underline-offset-2 hover:underline">
                    Log your first meal
                  </Link>{" "}
                  — or tap Suggest meal for an idea from your pantry. No scale needed.
                </EmptyState>
              )}
            </div>
          </Panel>
        </Stagger>
      )}
    </>
  );
}
