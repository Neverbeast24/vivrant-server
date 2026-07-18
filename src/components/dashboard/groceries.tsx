"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Package, ShoppingBasket, Sparkles, Trash2 } from "lucide-react";
import {
  addGroceryItem,
  clearCompletedGroceries,
  deleteGroceryItem,
  toggleGroceryItem,
} from "@/app/dashboard/groceries/actions";
import {
  addPlanItemsToList,
  generateSmartGroceryPlan,
} from "@/app/dashboard/groceries/ai-actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { toast } from "sonner";

type GroceryItem = {
  id: number;
  name: string;
  quantity: string | null;
  category: string | null;
  is_checked: boolean;
};

type Plan = {
  title: string;
  summary: string;
  meals: string[];
  items: { name: string; category: string; quantity: string }[];
};

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  produce: { label: "Fruits & vegetables", emoji: "🥬" },
  protein: { label: "Meat & protein", emoji: "🍗" },
  dairy: { label: "Dairy & eggs", emoji: "🥛" },
  grains: { label: "Grains & bread", emoji: "🍞" },
  pantry: { label: "Pantry staples", emoji: "🫙" },
  snacks: { label: "Snacks", emoji: "🍿" },
  drinks: { label: "Drinks", emoji: "🧃" },
  household: { label: "Household", emoji: "🧼" },
  other: { label: "Other", emoji: "🛒" },
};

const CATEGORY_ORDER = Object.keys(CATEGORY_META);

export function GroceriesView({ items }: { items: GroceryItem[] }) {
  const { pending, submit } = useModuleAction(addGroceryItem);
  const [togglePending, startToggle] = useTransition();
  const [planning, startPlan] = useTransition();
  const [plan, setPlan] = useState<Plan | null>(null);
  const done = items.filter((item) => item.is_checked).length;

  const grouped = CATEGORY_ORDER.map((key) => ({
    key,
    ...CATEGORY_META[key],
    items: items.filter((item) => (item.category ?? "other") === key),
  })).filter((group) => group.items.length > 0);

  function toggle(id: number, checked: boolean) {
    startToggle(async () => {
      const result = await toggleGroceryItem(id, checked);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    startToggle(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function buildPlan() {
    startPlan(async () => {
      const result = await generateSmartGroceryPlan();
      if (!result.ok || !("plan" in result) || !result.plan) {
        toast.error(result.message);
        return;
      }
      setPlan(result.plan);
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="GROCERIES"
        title="Shop"
        highlight="smarter."
        action={
          <PrimaryButton disabled={planning} onClick={buildPlan} className="rounded-full px-5">
            <Sparkles size={14} className="mr-1.5" />
            {planning ? "Planning…" : "AI meal + list"}
          </PrimaryButton>
        }
      />

      {plan && (
        <Panel title={plan.title} className="mb-4" right={<Sparkles size={16} className="text-[#5f45e6]" />}>
          <p className="text-sm leading-6 text-[#6f6b79]">{plan.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plan.meals.map((meal) => (
              <div key={meal} className="rounded-xl border border-[#26222f]/8 bg-[#f4efe4]/50 px-3 py-2 text-xs font-bold">
                {meal}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {plan.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm">
                <span className="font-bold">{item.name}</span>
                <span className="text-xs text-[#847f8c]">
                  {CATEGORY_META[item.category]?.emoji ?? "🛒"} {item.quantity}
                </span>
              </div>
            ))}
          </div>
          <PrimaryButton
            disabled={togglePending}
            className="mt-4"
            onClick={() => runAction(() => addPlanItemsToList(plan.items))}
          >
            Add all to shopping list
          </PrimaryButton>
        </Panel>
      )}

      <Panel title="Add grocery item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-4">
          <FormField label="Grocery item" hint="Required" className="sm:col-span-2">
            <input name="name" required placeholder="e.g. Green apples" className={fieldClass} />
          </FormField>
          <FormField label="Category">
            <select name="category" defaultValue="produce" className={fieldClass}>
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_META[key].emoji} {CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity">
            <input name="quantity" placeholder="e.g. 6 pcs" className={fieldClass} />
          </FormField>
          <PrimaryButton disabled={pending} className="sm:col-span-4">
            {pending ? "Saving…" : "Add item"}
          </PrimaryButton>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="List progress"
            value={`${done}/${items.length}`}
            detail="Items checked off"
            icon={ShoppingBasket}
            className="bg-gradient-to-br from-[#5f45e6] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Items"
            value={String(items.length)}
            detail="On your list"
            icon={Package}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
        </div>

        <Panel
          title="Shopping list"
          className="mt-4"
          right={
            done > 0 ? (
              <button
                type="button"
                disabled={togglePending}
                onClick={() => runAction(clearCompletedGroceries)}
                className="text-xs font-black text-[#5f45e6] transition hover:opacity-70"
              >
                Clear {done} completed
              </button>
            ) : null
          }
        >
          <div className="space-y-5">
            {grouped.map((group) => {
              const groupDone = group.items.filter((item) => item.is_checked).length;
              return (
                <section key={group.key}>
                  <header className="mb-2 flex items-center justify-between px-1">
                    <p className="flex items-center gap-2 text-xs font-black tracking-wide text-[#6b6675]">
                      <span className="text-sm leading-none">{group.emoji}</span>
                      {group.label.toUpperCase()}
                    </p>
                    <span className="text-[10px] font-bold text-[#a19ca7]">
                      {groupDone}/{group.items.length}
                    </span>
                  </header>
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {group.items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          className="flex w-full items-center gap-3 rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/45 p-2 text-left transition hover:border-[#26222f]/12 hover:bg-[#fdfbf4]"
                        >
                          <button
                            type="button"
                            disabled={togglePending}
                            onClick={() => toggle(item.id, !item.is_checked)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5"
                          >
                            <span className={`grid size-6 place-items-center rounded-lg border-2 ${item.is_checked ? "border-[#26bea9] bg-[#26bea9] text-white" : "border-[#d4cec0]"}`}>
                              {item.is_checked && <Check size={13} />}
                            </span>
                            <span className={`min-w-0 flex-1 truncate text-left text-sm font-bold ${item.is_checked ? "text-[#a9a4b0] line-through" : "text-[#332f3c]"}`}>
                              {item.name}
                            </span>
                          </button>
                          <span className="shrink-0 text-xs font-semibold text-[#847f8c]">{item.quantity ?? "—"}</span>
                          <button
                            type="button"
                            disabled={togglePending}
                            onClick={() => runAction(() => deleteGroceryItem(item.id))}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#a9a4b0] transition hover:bg-[#fff0e8] hover:text-[#e4571f]"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              );
            })}
            {!items.length && <EmptyState>Your list is empty.</EmptyState>}
          </div>
        </Panel>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="mt-4 rounded-[1.4rem] border border-[#26222f]/8 bg-gradient-to-br from-[#fbf3e2] via-[#fdfbf4] to-[#efeaff] p-5"
        >
          <Sparkles size={18} className="text-[#5f45e6]" />
          <p className="mt-4 text-sm font-bold leading-6">
            Swap white rice for quinoa to boost protein within the same budget.
          </p>
        </motion.article>
      </Stagger>
    </>
  );
}
