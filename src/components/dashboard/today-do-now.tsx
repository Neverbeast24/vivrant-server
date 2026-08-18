"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { toggleGroceryItem } from "@/app/dashboard/groceries/actions";
import { toggleHabitToday } from "@/app/dashboard/habits/actions";
import { addHydration } from "@/app/dashboard/hydration/actions";
import { EmptyState, Panel, PrimaryButton } from "@/components/dashboard/ui";

export type TodayHabit = {
  id: number;
  title: string;
  doneToday: boolean;
};

export type TodayGrocery = {
  id: number;
  name: string;
  quantity: string | null;
};

export function TodayDoNow({
  habits,
  groceries,
  waterMl,
  waterGoalMl,
  calories,
  calorieGoal = 2000,
}: {
  habits: TodayHabit[];
  groceries: TodayGrocery[];
  waterMl: number;
  waterGoalMl: number;
  calories: number;
  calorieGoal?: number;
}) {
  const [pending, start] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const waterLeft = Math.max(0, waterGoalMl - waterMl);
  const calLeft = Math.max(0, calorieGoal - calories);

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-3">
      <Panel
        title="Habits today"
        right={
          <Link href="/dashboard/habits" className="text-xs font-black text-accent">
            All →
          </Link>
        }
      >
        {habits.length ? (
          <ul className="space-y-2">
            {habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => toggleHabitToday(habit.id, !habit.doneToday))}
                  className={`grid size-8 place-items-center rounded-lg border ${
                    habit.doneToday
                      ? "border-accent bg-accent text-white"
                      : "border-ink/15 text-muted"
                  }`}
                  aria-label={habit.doneToday ? `Uncheck ${habit.title}` : `Check ${habit.title}`}
                >
                  <Check size={14} />
                </button>
                <span className={`truncate text-sm font-bold ${habit.doneToday ? "text-muted line-through" : ""}`}>
                  {habit.title}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            <Link href="/dashboard/habits" className="font-bold text-accent hover:underline">
              Add a habit
            </Link>{" "}
            so it shows up here each morning.
          </EmptyState>
        )}
      </Panel>

      <Panel
        title="Water & food"
        right={
          <Link href="/dashboard/nutrition/log" className="text-xs font-black text-accent">
            Log meal →
          </Link>
        }
      >
        <p className="mb-3 text-xs text-muted">
          {waterMl} ml of {waterGoalMl} ml · {calLeft} kcal left of {calorieGoal}
        </p>
        <div className="flex flex-wrap gap-2">
          {[250, 500].map((ml) => (
            <PrimaryButton
              key={ml}
              type="button"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("amount_ml", String(ml));
                run(() => addHydration(fd));
              }}
              className="rounded-full px-4 py-2 text-xs"
            >
              +{ml} ml
            </PrimaryButton>
          ))}
        </div>
        {waterLeft === 0 ? (
          <p className="mt-3 text-xs font-bold text-accent">Water goal hit.</p>
        ) : null}
      </Panel>

      <Panel
        title="Shopping"
        right={
          <Link href="/dashboard/groceries" className="text-xs font-black text-accent">
            List →
          </Link>
        }
      >
        {groceries.length ? (
          <ul className="space-y-2">
            {groceries.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => toggleGroceryItem(item.id, true))}
                  className="grid size-8 place-items-center rounded-lg border border-ink/15 text-muted"
                  aria-label={`Check off ${item.name}`}
                >
                  <Check size={14} />
                </button>
                <span className="truncate text-sm font-bold">
                  {item.name}
                  {item.quantity ? (
                    <span className="ml-1 font-semibold text-muted">{item.quantity}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            List is clear.{" "}
            <Link href="/dashboard/kitchen" className="font-bold text-accent hover:underline">
              Kitchen
            </Link>{" "}
            if something’s running low.
          </EmptyState>
        )}
      </Panel>
    </div>
  );
}
