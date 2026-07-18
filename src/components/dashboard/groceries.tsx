"use client";

import { useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Package, ShoppingBasket, Sparkles, Trash2 } from "lucide-react";
import {
  addGroceryItem,
  clearCompletedGroceries,
  deleteGroceryItem,
  toggleGroceryItem,
} from "@/app/dashboard/groceries/actions";
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
  is_checked: boolean;
};

export function GroceriesView({ items }: { items: GroceryItem[] }) {
  const { pending, submit } = useModuleAction(addGroceryItem);
  const [togglePending, startToggle] = useTransition();
  const done = items.filter((item) => item.is_checked).length;

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

  return (
    <>
      <PageHeader eyebrow="GROCERIES" title="Shop" highlight="smarter." />

      <Panel title="Add grocery item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-3">
          <FormField label="Grocery item" hint="Required" className="sm:col-span-2">
            <input name="name" required placeholder="e.g. Green apples" className={fieldClass} />
          </FormField>
          <FormField label="Quantity">
            <input name="quantity" placeholder="e.g. 6 pcs" className={fieldClass} />
          </FormField>
          <PrimaryButton disabled={pending} className="sm:col-span-3">
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
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
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
                    <span className={`flex-1 text-sm font-bold ${item.is_checked ? "text-[#a9a4b0] line-through" : ""}`}>
                      {item.name}
                    </span>
                  </button>
                  <span className="text-xs text-[#847f8c]">{item.quantity ?? "—"}</span>
                  <button
                    type="button"
                    disabled={togglePending}
                    onClick={() => runAction(() => deleteGroceryItem(item.id))}
                    className="grid size-8 place-items-center rounded-lg text-[#a9a4b0] transition hover:bg-[#fff0e8] hover:text-[#e4571f]"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
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
