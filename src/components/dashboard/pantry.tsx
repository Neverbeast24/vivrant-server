"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  AlertTriangle,
  LayoutDashboard,
  Minus,
  PackagePlus,
  Plus,
  Refrigerator,
  ShoppingBasket,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addPantryItem,
  addLowStockToGroceryList,
  deletePantryItem,
  updatePantryStock,
} from "@/app/dashboard/pantry/actions";
import {
  categoryLabel,
  LOW_STOCK_THRESHOLD,
  PANTRY_CATEGORIES,
  type PantryItem,
} from "@/app/dashboard/pantry/shared";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
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
import { pantrySubNav } from "@/lib/nav";

export type PantryMode = "overview" | "items" | "categories" | "low-stock" | "add";

function usePantryActions() {
  const { pending, submit } = useModuleAction(addPantryItem);
  const [updating, startUpdate] = useTransition();

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    startUpdate(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return { pending, submit, updating, runAction };
}

function PantryAddForm({
  pending,
  submit,
  defaultCategory = "grains",
}: {
  pending: boolean;
  submit: (formData: FormData) => void;
  defaultCategory?: string;
}) {
  return (
    <form action={submit} className="grid gap-3 sm:grid-cols-4">
      <FormField label="Pantry item" hint="Required" className="sm:col-span-2">
        <input name="name" required placeholder="e.g. Brown rice" className={fieldClass} />
      </FormField>
      <FormField label="Category">
        <select name="category" defaultValue={defaultCategory} className={fieldClass}>
          {PANTRY_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
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
  );
}

function StockRow({
  item,
  updating,
  runAction,
}: {
  item: PantryItem;
  updating: boolean;
  runAction: (action: () => Promise<{ ok: boolean; message: string }>) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/6 bg-surface/35 p-3">
      <div className="mb-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{item.name}</p>
          <p className="mt-0.5 text-[10px] capitalize text-muted">
            {categoryLabel(item.category)}
          </p>
        </div>
        <button
          type="button"
          disabled={updating || item.stock_level <= 0}
          onClick={() =>
            runAction(() => updatePantryStock(item.id, Math.max(0, item.stock_level - 10)))
          }
          className="grid size-8 place-items-center rounded-lg bg-panel text-muted shadow-sm disabled:opacity-40"
          aria-label={`Decrease ${item.name} stock`}
        >
          <Minus size={14} />
        </button>
        <span className="w-10 text-center text-xs font-black text-muted">
          {item.stock_level}%
        </span>
        <button
          type="button"
          disabled={updating || item.stock_level >= 100}
          onClick={() =>
            runAction(() => updatePantryStock(item.id, Math.min(100, item.stock_level + 10)))
          }
          className="grid size-8 place-items-center rounded-lg bg-panel text-accent shadow-sm disabled:opacity-40"
          aria-label={`Increase ${item.name} stock`}
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          disabled={updating}
          onClick={() => runAction(() => deletePantryItem(item.id))}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <Progress value={item.stock_level} />
    </div>
  );
}

function PantryOverview({ items }: { items: PantryItem[] }) {
  const lowStock = items.filter((item) => item.stock_level <= LOW_STOCK_THRESHOLD);
  const categories = new Set(items.map((item) => item.category)).size;
  const wellStocked = items.filter((item) => item.stock_level > LOW_STOCK_THRESHOLD).length;

  return (
    <>
      <PageHeader eyebrow="PANTRY" title="Know what you" highlight="have." />
      <ModuleSubNav items={pantrySubNav} />

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Items tracked"
            value={String(items.length)}
            detail="In your pantry"
            icon={Refrigerator}
            className="bg-gradient-to-br from-accent-deep to-accent text-white"
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
            className="bg-ember/10 text-ember"
          />
          <StatCard
            label="Categories"
            value={String(categories)}
            detail={`${wellStocked} item${wellStocked === 1 ? "" : "s"} well stocked`}
            icon={Tags}
            className="bg-accent-soft text-accent-deep"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/dashboard/pantry/items",
              title: "All items",
              detail: `${items.length} tracked — adjust stock anytime`,
              icon: Refrigerator,
            },
            {
              href: "/dashboard/pantry/categories",
              title: "Categories",
              detail: "Browse by food type",
              icon: Tags,
            },
            {
              href: "/dashboard/pantry/low-stock",
              title: "Low stock",
              detail: `${lowStock.length} need${lowStock.length === 1 ? "s" : ""} attention`,
              icon: AlertTriangle,
            },
            {
              href: "/dashboard/pantry/add",
              title: "Add item",
              detail: "Log something new on the shelf",
              icon: PackagePlus,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              title={card.detail}
              className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-card px-4 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <card.icon size={15} />
              </span>
              <span className="truncate">{card.title}</span>
            </Link>
          ))}
        </div>

        <Panel
          title="Needs restock soon"
          className="mt-4"
          right={
            <Link
              href="/dashboard/pantry/low-stock"
              className="text-[11px] font-black text-accent hover:underline"
            >
              View all
            </Link>
          }
        >
          {lowStock.length ? (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink/6 bg-panel/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted">
                      {categoryLabel(item.category)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-ember">
                    {item.stock_level}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Nothing running low. Nice work keeping the pantry stocked.</EmptyState>
          )}
        </Panel>

        <Panel title="Quick start" className="mt-4" right={<LayoutDashboard size={16} className="text-accent" />}>
          <p className="text-sm leading-6 text-muted">
            Track shelf stock by category, flag what’s low, then jump to groceries when it’s time to
            restock.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/pantry/add" className="inline-flex">
              <PrimaryButton className="rounded-full px-5">Add an item</PrimaryButton>
            </Link>
            <Link
              href="/dashboard/groceries"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              <ShoppingBasket size={13} />
              Open groceries
            </Link>
          </div>
        </Panel>
      </Stagger>
    </>
  );
}

function PantryItems({ items }: { items: PantryItem[] }) {
  const { updating, runAction } = usePantryActions();

  return (
    <>
      <PageHeader
        eyebrow="PANTRY"
        title="Full"
        highlight="inventory."
        action={
          <Link href="/dashboard/pantry/add" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">Add item</PrimaryButton>
          </Link>
        }
      />
      <ModuleSubNav items={pantrySubNav} />

      <Panel title="Stock levels">
        <div className="space-y-4">
          {items.map((item) => (
            <StockRow key={item.id} item={item} updating={updating} runAction={runAction} />
          ))}
          {!items.length && (
            <EmptyState>
              No pantry items yet.{" "}
              <Link href="/dashboard/pantry/add" className="font-bold text-accent hover:underline">
                Add your first item
              </Link>
              .
            </EmptyState>
          )}
        </div>
      </Panel>
    </>
  );
}

function PantryCategories({ items }: { items: PantryItem[] }) {
  const { updating, runAction } = usePantryActions();
  const grouped: { value: string; label: string; items: PantryItem[] }[] = PANTRY_CATEGORIES.map(
    (cat) => ({
      ...cat,
      items: items.filter((item) => item.category === cat.value),
    }),
  ).filter((group) => group.items.length > 0);

  const extras = items.filter(
    (item) => !PANTRY_CATEGORIES.some((cat) => cat.value === item.category),
  );
  if (extras.length) {
    grouped.push({ value: "custom", label: "Other labels", items: extras });
  }

  return (
    <>
      <PageHeader eyebrow="PANTRY" title="Browse by" highlight="category." />
      <ModuleSubNav items={pantrySubNav} />

      <Stagger>
        {!grouped.length && (
          <EmptyState>
            Nothing categorized yet.{" "}
            <Link href="/dashboard/pantry/add" className="font-bold text-accent hover:underline">
              Add an item
            </Link>{" "}
            to start grouping your shelves.
          </EmptyState>
        )}
        <div className="space-y-4">
          {grouped.map((group) => {
            const avg = Math.round(
              group.items.reduce((sum, item) => sum + item.stock_level, 0) / group.items.length,
            );
            return (
              <Panel
                key={group.value}
                title={group.label}
                right={
                  <span className="text-[11px] font-black text-muted">
                    {group.items.length} item{group.items.length === 1 ? "" : "s"} · avg {avg}%
                  </span>
                }
              >
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <StockRow
                      key={item.id}
                      item={item}
                      updating={updating}
                      runAction={runAction}
                    />
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      </Stagger>
    </>
  );
}

function PantryLowStock({ items }: { items: PantryItem[] }) {
  const { updating, runAction } = usePantryActions();
  const lowStock = items
    .filter((item) => item.stock_level <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock_level - b.stock_level);

  return (
    <>
      <PageHeader
        eyebrow="PANTRY"
        title="Running"
        highlight="low."
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              disabled={updating}
              className="rounded-full"
              onClick={() => runAction(addLowStockToGroceryList)}
            >
              <ShoppingBasket size={13} />
              Add to groceries
            </PrimaryButton>
            <Link
              href="/dashboard/groceries"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-panel/70 px-4 py-2.5 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              <ShoppingBasket size={13} />
              Groceries
            </Link>
          </div>
        }
      />
      <ModuleSubNav items={pantrySubNav} />

      <Panel
        title={`Needs restock (≤${LOW_STOCK_THRESHOLD}%)`}
        right={
          <span className="text-[11px] font-black text-ember">
            {lowStock.length} item{lowStock.length === 1 ? "" : "s"}
          </span>
        }
      >
        <div className="space-y-4">
          {lowStock.map((item) => (
            <StockRow key={item.id} item={item} updating={updating} runAction={runAction} />
          ))}
          {!lowStock.length && (
            <EmptyState>All clear — nothing is at or below {LOW_STOCK_THRESHOLD}% stock.</EmptyState>
          )}
        </div>
      </Panel>
    </>
  );
}

function PantryAdd({ defaultCategory }: { defaultCategory?: string }) {
  const { pending, submit } = usePantryActions();

  return (
    <>
      <PageHeader eyebrow="PANTRY" title="Add to the" highlight="shelf." />
      <ModuleSubNav items={pantrySubNav} />

      <Panel title="New pantry item">
        <PantryAddForm pending={pending} submit={submit} defaultCategory={defaultCategory} />
      </Panel>
    </>
  );
}

export function PantryView({
  mode = "overview",
  items,
  defaultCategory,
}: {
  mode?: PantryMode;
  items: PantryItem[];
  defaultCategory?: string;
}) {
  if (mode === "items") return <PantryItems items={items} />;
  if (mode === "categories") return <PantryCategories items={items} />;
  if (mode === "low-stock") return <PantryLowStock items={items} />;
  if (mode === "add") return <PantryAdd defaultCategory={defaultCategory} />;
  return <PantryOverview items={items} />;
}
