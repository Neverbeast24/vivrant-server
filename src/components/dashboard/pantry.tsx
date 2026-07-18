"use client";

import { useTransition } from "react";
import { AlertTriangle, Minus, Plus, Refrigerator, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addPantryItem,
  deletePantryItem,
  updatePantryStock,
} from "@/app/dashboard/pantry/actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type PantryItem = {
  id: number;
  name: string;
  category: string;
  stock_level: number;
};

export function PantryView({ items }: { items: PantryItem[] }) {
  const { pending, submit } = useModuleAction(addPantryItem);
  const [updating, startUpdate] = useTransition();
  const lowStock = items.filter((item) => item.stock_level <= 25);
  const categories = new Set(items.map((item) => item.category)).size;

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    startUpdate(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader eyebrow="PANTRY" title="Know what you" highlight="have." />

      <Panel title="Add pantry item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-4">
          <FormField label="Pantry item" hint="Required" className="sm:col-span-2">
            <input name="name" required placeholder="e.g. Brown rice" className={fieldClass} />
          </FormField>
          <FormField label="Category">
            <select name="category" defaultValue="grains" className={fieldClass}>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="protein">Protein</option>
              <option value="dairy">Dairy</option>
              <option value="grains">Grains</option>
              <option value="snacks">Snacks</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Stock level" hint="percent">
            <input
              name="stock_level"
              type="number"
              min={0}
              max={100}
              defaultValue={50}
              className={fieldClass}
            />
          </FormField>
          <PrimaryButton disabled={pending} className="sm:col-span-4">
            {pending ? "Saving…" : "Add to pantry"}
          </PrimaryButton>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Items tracked"
            value={String(items.length)}
            detail="In your pantry"
            icon={Refrigerator}
            className="bg-gradient-to-br from-[#5f45e6] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Running low"
            value={String(lowStock.length)}
            detail={
              lowStock.length
                ? `Restock: ${lowStock
                    .slice(0, 2)
                    .map((item) => item.name)
                    .join(", ")}${lowStock.length > 2 ? "…" : ""}`
                : "Everything is stocked"
            }
            icon={AlertTriangle}
            className="bg-[#fff3e8] text-[#533621]"
          />
          <StatCard
            label="Categories"
            value={String(categories)}
            detail="Types of food on hand"
            icon={Tags}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
        </div>
        <Panel title="Stock levels" className="mt-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/35 p-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{item.name}</p>
                    <p className="mt-0.5 text-[10px] capitalize text-[#918b96]">{item.category}</p>
                  </div>
                  <button
                    type="button"
                    disabled={updating || item.stock_level <= 0}
                    onClick={() => runAction(() => updatePantryStock(item.id, Math.max(0, item.stock_level - 10)))}
                    className="grid size-8 place-items-center rounded-lg bg-white text-[#6f6877] shadow-sm disabled:opacity-40"
                    aria-label={`Decrease ${item.name} stock`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-xs font-black text-[#847f8c]">{item.stock_level}%</span>
                  <button
                    type="button"
                    disabled={updating || item.stock_level >= 100}
                    onClick={() => runAction(() => updatePantryStock(item.id, Math.min(100, item.stock_level + 10)))}
                    className="grid size-8 place-items-center rounded-lg bg-white text-[#5f45e6] shadow-sm disabled:opacity-40"
                    aria-label={`Increase ${item.name} stock`}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => runAction(() => deletePantryItem(item.id))}
                    className="grid size-8 place-items-center rounded-lg text-[#a9a4b0] transition hover:bg-[#fff0e8] hover:text-[#e4571f]"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Progress value={item.stock_level} />
              </div>
            ))}
            {!items.length && (
              <EmptyState>No pantry items yet. Add your first item above.</EmptyState>
            )}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
