"use client";

import { Apple, Droplets, Flame } from "lucide-react";
import { logMeal } from "@/app/dashboard/nutrition/actions";
import { PageHeader, Panel, Stagger, StatCard } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Meal = {
  id: number;
  meal_name: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  logged_at: string;
};

export function NutritionView({ meals }: { meals: Meal[] }) {
  const { pending, submit } = useModuleAction(logMeal);
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="NUTRITION" title="Eat with" highlight="intention." />

      <Panel title="Log a meal" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="meal_name" required placeholder="Meal name" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm sm:col-span-2" />
          <select name="meal_type" defaultValue="lunch" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <input name="calories" type="number" min={0} placeholder="Calories" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <input name="protein_g" type="number" min={0} placeholder="Protein (g)" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <button disabled={pending} className="rounded-2xl bg-[#24212e] px-4 py-3 text-sm font-bold text-white sm:col-span-2 lg:col-span-4">
            {pending ? "Saving…" : "Log meal"}
          </button>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Calories today"
            value={String(totalCalories)}
            detail={`${meals.length} meals logged`}
            icon={Flame}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Water"
            value="1.6L"
            suffix="/ 2.4L"
            detail="Two glasses to go"
            icon={Droplets}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Diet quality"
            value="92%"
            detail="Balanced this week"
            icon={Apple}
            className="bg-[#fff3e8] text-[#533621]"
          />
        </div>

        <Panel title="Logged meals" className="mt-4">
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{meal.meal_name}</p>
                  <p className="text-xs capitalize text-[#847f8c]">{meal.meal_type}</p>
                </div>
                <span className="text-xs font-black">{meal.calories ?? 0} kcal</span>
              </div>
            ))}
            {!meals.length && <p className="text-sm text-[#9a95a0]">No meals logged yet.</p>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
