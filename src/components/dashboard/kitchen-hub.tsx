"use client";

import { useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Refrigerator, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { toggleGroceryItem } from "@/app/dashboard/groceries/actions";
import {
  addLowStockToGroceryList,
  addPantryItemToGroceryList,
} from "@/app/dashboard/pantry/actions";
import { LOW_STOCK_THRESHOLD } from "@/app/dashboard/pantry/shared";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import {
  EmptyState,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
} from "@/components/dashboard/ui";
import { kitchenSubNav } from "@/lib/nav";

export type KitchenGrocery = {
  id: number;
  name: string;
  quantity: string | null;
  is_checked: boolean;
};

export type KitchenPantry = {
  id: number;
  name: string;
  category: string;
  stock_level: number;
};

export function KitchenHub({
  groceries,
  pantry,
}: {
  groceries: KitchenGrocery[];
  pantry: KitchenPantry[];
}) {
  const [pending, start] = useTransition();
  const groceryOpen = groceries.filter((g) => !g.is_checked);
  const groceryDone = groceries.filter((g) => g.is_checked).length;
  const lowStock = pantry
    .filter((p) => Number(p.stock_level ?? 0) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock_level - b.stock_level);
  const openNames = new Set(groceryOpen.map((g) => g.name.trim().toLowerCase()));

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <PageHeader eyebrow="KITCHEN" title="Shop and" highlight="stock." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        Check off shopping here and it restocks the pantry. Low stock on the shelf goes straight onto
        the list.
      </p>
      <ModuleSubNav items={kitchenSubNav} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Shopping list"
            value={`${groceryOpen.length}`}
            detail={`${groceryOpen.length} open · ${groceries.length} total`}
            icon={ShoppingBasket}
          />
          <StatCard
            label="Pantry items"
            value={String(pantry.length)}
            detail="On the shelf"
            icon={Refrigerator}
          />
          <StatCard
            label="Low stock"
            value={String(lowStock.length)}
            detail={lowStock.length ? "Needs a restock" : "Looks stocked"}
            icon={AlertTriangle}
          />
        </div>
      </Stagger>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Panel
          title="Shopping list"
          right={
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard/groceries" className="text-xs font-black text-accent">
                Full list →
              </Link>
              <Link href="/dashboard/groceries/sheet" className="text-xs font-black text-muted hover:text-accent">
                Sheet
              </Link>
            </div>
          }
        >
          <ul className="space-y-2">
            {groceryOpen.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-ink/8 px-3 py-3"
              >
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => toggleGroceryItem(item.id, true))}
                  className="grid size-9 place-items-center rounded-xl border border-ink/15 text-muted"
                  aria-label={`Check off ${item.name}`}
                >
                  <Check size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  {item.quantity ? (
                    <p className="text-xs text-muted">{item.quantity}</p>
                  ) : null}
                </div>
              </li>
            ))}
            {!groceryOpen.length && (
              <EmptyState>
                {groceryDone
                  ? "List is cleared. Add low-stock items from the pantry, or open Shopping."
                  : "Nothing on the list yet. Add low-stock items on the right, or open Shopping."}
              </EmptyState>
            )}
          </ul>
        </Panel>

        <Panel
          title="Low stock → list"
          right={
            <PrimaryButton
              disabled={pending || !lowStock.length}
              onClick={() => run(addLowStockToGroceryList)}
              className="rounded-full px-4 py-2 text-xs"
            >
              Add all
            </PrimaryButton>
          }
        >
          <ul className="space-y-2">
            {lowStock.slice(0, 10).map((item) => {
              const onList = openNames.has(item.name.trim().toLowerCase());
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-ink/8 px-3 py-3"
                >
                  <button
                    type="button"
                    disabled={pending || onList}
                    onClick={() => run(() => addPantryItemToGroceryList(item.id))}
                    className={`grid size-9 place-items-center rounded-xl border ${
                      onList
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-ink/15 text-muted"
                    }`}
                    aria-label={onList ? `${item.name} already on list` : `Add ${item.name}`}
                  >
                    <Check size={16} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.stock_level}% · {onList ? "Already on list" : "Tap to add"}
                    </p>
                  </div>
                </li>
              );
            })}
            {!lowStock.length && (
              <EmptyState>Pantry looks stocked. Open Pantry to adjust levels.</EmptyState>
            )}
          </ul>
        </Panel>
      </div>
    </>
  );
}
