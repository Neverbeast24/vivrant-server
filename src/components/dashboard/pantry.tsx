"use client";

import { Refrigerator } from "lucide-react";
import { addPantryItem } from "@/app/dashboard/pantry/actions";
import { PageHeader, Panel, Progress, Stagger, StatCard } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type PantryItem = {
  id: number;
  name: string;
  category: string;
  stock_level: number;
};

export function PantryView({ items }: { items: PantryItem[] }) {
  const { pending, submit } = useModuleAction(addPantryItem);

  return (
    <>
      <PageHeader eyebrow="PANTRY" title="Know what you" highlight="have." />

      <Panel title="Add pantry item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Item name"
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
          />
          <input
            name="category"
            defaultValue="vegetables"
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            name="stock_level"
            type="number"
            min={0}
            max={100}
            defaultValue={50}
            className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            disabled={pending}
            className="rounded-2xl bg-[#24212e] px-4 py-3 text-sm font-bold text-white sm:col-span-4"
          >
            {pending ? "Saving…" : "Add to pantry"}
          </button>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Items tracked"
            value={String(items.length)}
            detail="In your pantry"
            icon={Refrigerator}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
          />
        </div>
        <Panel title="Stock levels" className="mt-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id}>
                <div className="mb-2 flex justify-between text-sm font-bold">
                  <span>{item.name}</span>
                  <span className="text-[#847f8c]">{item.stock_level}%</span>
                </div>
                <Progress value={item.stock_level} />
              </div>
            ))}
            {!items.length && (
              <p className="text-sm text-[#9a95a0]">No pantry items yet. Add your first item above.</p>
            )}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
