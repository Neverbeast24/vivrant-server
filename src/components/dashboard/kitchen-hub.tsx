"use client";

import Link from "next/link";
import { AlertTriangle, Refrigerator, ShoppingBasket } from "lucide-react";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { PageHeader, Panel, PrimaryButton, Stagger, StatCard } from "@/components/dashboard/ui";
import { kitchenSubNav } from "@/lib/nav";

export function KitchenHub({
  groceryOpen,
  groceryTotal,
  pantryCount,
  lowStockCount,
}: {
  groceryOpen: number;
  groceryTotal: number;
  pantryCount: number;
  lowStockCount: number;
}) {
  return (
    <>
      <PageHeader eyebrow="KITCHEN" title="Shop and" highlight="stock." />
      <p className="-mt-5 mb-4 max-w-xl text-sm text-muted">
        One kitchen flow: shopping list for what you need, pantry for what you already have.
      </p>
      <ModuleSubNav items={kitchenSubNav} />

      <Stagger>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Shopping list"
            value={`${groceryOpen}`}
            detail={`${groceryOpen} open · ${groceryTotal} total`}
            icon={ShoppingBasket}
          />
          <StatCard
            label="Pantry items"
            value={String(pantryCount)}
            detail="On the shelf"
            icon={Refrigerator}
          />
          <StatCard
            label="Low stock"
            value={String(lowStockCount)}
            detail={lowStockCount ? "Needs a restock" : "Looks stocked"}
            icon={AlertTriangle}
          />
        </div>
      </Stagger>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Panel
          title="Shopping"
          right={
            <Link href="/dashboard/groceries" className="inline-flex">
              <PrimaryButton className="rounded-full px-4 py-2 text-xs">Open list</PrimaryButton>
            </Link>
          }
        >
          <p className="text-sm leading-6 text-muted">
            Build a smart grocery list, estimate costs, and clear completed picks.
          </p>
        </Panel>
        <Panel
          title="Pantry"
          right={
            <Link href="/dashboard/pantry" className="inline-flex">
              <PrimaryButton className="rounded-full px-4 py-2 text-xs">Open pantry</PrimaryButton>
            </Link>
          }
        >
          <p className="text-sm leading-6 text-muted">
            Track inventory, spot low stock, and push restocks straight to the shopping list.
          </p>
        </Panel>
      </div>
    </>
  );
}
