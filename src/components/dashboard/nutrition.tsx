"use client";

import { useRef, useState, useTransition } from "react";
import { Apple, Camera, Droplets, Flame, ImagePlus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteMeal, logMeal } from "@/app/dashboard/nutrition/actions";
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

const nutritionSubNav = [
  { href: "/dashboard/nutrition", label: "Overview" },
  { href: "/dashboard/nutrition/log", label: "Log meal" },
] as const;

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
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [tip, setTip] = useState<string | null>(null);
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

  function estimate() {
    startEstimate(async () => {
      if (!description.trim() && !photoFile) {
        toast.error("Describe the meal or attach a photo first.");
        return;
      }
      const formData = new FormData();
      if (description.trim()) formData.set("description", description.trim());
      if (photoFile) formData.set("photo", photoFile);

      const result = await estimateMealWithAi(formData);
      if (!result.ok || !("estimate" in result) || !result.estimate) {
        toast.error(result.message);
        return;
      }
      const { estimate: e } = result;
      setMealName(e.meal_name);
      setMealType(e.meal_type);
      setCalories(String(e.calories));
      setProtein(String(e.protein_g));
      setCarbs(String(e.carbs_g));
      setFat(String(e.fat_g));
      setTip(e.tip);
      toast.success(result.message);
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
          <Panel
            title="AI meal estimate"
            className="mb-4"
            right={<Sparkles size={16} className="text-[#0e7c66]" />}
          >
            <div className="space-y-3">
              <FormField label="Describe your meal" hint="Optional if you attach a photo">
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
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-[#14221b]/10 bg-[#e8efe9]/70 px-3.5 py-2.5 text-xs font-black text-[#0e7c66] transition hover:bg-white"
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
                      className="size-14 rounded-xl border border-[#14221b]/8 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-[#14221b] text-white"
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
                  <Camera size={14} className="mr-1.5 inline" />
                  {estimating ? "Estimating…" : "Estimate macros"}
                </PrimaryButton>
              </div>

              <p className="text-xs leading-5 text-[#6a7a71]">
                AI fills the log form below. Review the numbers, then tap Log meal.
              </p>
              {tip && <p className="text-sm font-semibold text-[#0e7c66]">{tip}</p>}
            </div>
          </Panel>

          <Panel title="Log a meal" className="mb-4">
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
              <FormField label="Calories" hint="kcal">
                <input
                  name="calories"
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(event) => setCalories(event.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Protein" hint="grams">
                <input
                  name="protein_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Carbs" hint="grams">
                <input
                  name="carbs_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={carbs}
                  onChange={(event) => setCarbs(event.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Fat" hint="grams">
                <input
                  name="fat_g"
                  type="number"
                  min={0}
                  step="0.1"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </FormField>
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
              className="bg-gradient-to-br from-[#0a5c4c] to-[#0e7c66] text-white"
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
              className="bg-[#e8fbf8] text-[#183d3a]"
            />
            <StatCard
              label="Diet quality"
              value={`${dietScore}%`}
              detail={meals.length ? "Based on today’s logs" : "Log a meal to score"}
              icon={Apple}
              className="bg-[#fff3e8] text-[#533621]"
            />
          </div>

          <Panel title="Logged meals" className="mt-4">
            <div className="space-y-2">
              {meals.map((meal) => (
                <ListRow
                  key={meal.id}
                  title={meal.meal_name}
                  meta={meal.meal_type}
                  right={
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-black">{meal.calories ?? 0} kcal</span>
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
                        className="grid size-8 place-items-center rounded-lg text-[#8a9a91] transition hover:bg-[#f8ece4] hover:text-[#c45c2a]"
                        aria-label={`Delete ${meal.meal_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  }
                />
              ))}
              {!meals.length && <EmptyState>No meals logged yet.</EmptyState>}
            </div>
          </Panel>
        </Stagger>
      )}
    </>
  );
}
