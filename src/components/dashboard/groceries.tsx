"use client";

import { useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Package, ShoppingBasket, Sparkles } from "lucide-react";
import { addGroceryItem, toggleGroceryItem } from "@/app/dashboard/groceries/actions";
import { PageHeader, Panel, Stagger, StatCard } from "@/components/dashboard/ui";
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

  return (
    <>
      <PageHeader eyebrow="GROCERIES" title="Shop" highlight="smarter." />

      <Panel title="Add grocery item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-3">
          <input name="name" required placeholder="Item name" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm sm:col-span-2" />
          <input name="quantity" placeholder="Qty" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <button disabled={pending} className="rounded-2xl bg-[#24212e] px-4 py-3 text-sm font-bold text-white sm:col-span-3">
            {pending ? "Saving…" : "Add item"}
          </button>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="List progress"
            value={`${done}/${items.length}`}
            detail="Items checked off"
            icon={ShoppingBasket}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Items"
            value={String(items.length)}
            detail="On your list"
            icon={Package}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
        </div>

        <Panel title="Shopping list" className="mt-4">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  disabled={togglePending}
                  onClick={() => toggle(item.id, !item.is_checked)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-3.5 text-left"
                >
                  <span
                    className={`grid size-6 place-items-center rounded-lg border-2 ${
                      item.is_checked ? "border-[#26bea9] bg-[#26bea9] text-white" : "border-[#d8d3df]"
                    }`}
                  >
                    {item.is_checked && <Check size={13} />}
                  </span>
                  <span className={`flex-1 text-sm font-bold ${item.is_checked ? "line-through text-[#a9a4b0]" : ""}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-[#847f8c]">{item.quantity ?? "—"}</span>
                </motion.button>
              ))}
            </AnimatePresence>
            {!items.length && <p className="text-sm text-[#9a95a0]">Your list is empty.</p>}
          </div>
        </Panel>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="mt-4 rounded-[1.6rem] bg-gradient-to-br from-[#ddf8f3] via-[#eefaf6] to-[#f7f2ff] p-5"
        >
          <Sparkles size={18} className="text-[#7557ff]" />
          <p className="mt-4 text-sm font-bold leading-6">
            Swap white rice for quinoa to boost protein within the same budget.
          </p>
        </motion.article>
      </Stagger>
    </>
  );
}
