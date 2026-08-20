"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  LayoutDashboard,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  Refrigerator,
  ShoppingBasket,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import {
  addPantryItem,
  addPantryItemsBulk,
  addLowStockToGroceryList,
  addPantryItemToGroceryList,
  deletePantryItem,
  updatePantryItem,
  updatePantryStock,
} from "@/app/dashboard/pantry/actions";
import { toggleGroceryItem } from "@/app/dashboard/groceries/actions";
import {
  categoryLabel,
  LOW_STOCK_THRESHOLD,
  PANTRY_CATEGORIES,
  type PantryItem,
} from "@/app/dashboard/pantry/shared";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { EntryModeToggle, useEntryMode } from "@/components/dashboard/entry-mode-toggle";
import { PantrySheet } from "@/components/dashboard/pantry-sheet";
import { QuickListPaste } from "@/components/dashboard/quick-list-paste";
import { DragGrip, ItemDragRow } from "@/components/dashboard/drag-list";
import { useSavedListOrder } from "@/components/dashboard/use-saved-list-order";
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
import { pantryDoc } from "@/lib/share-export";
import { kitchenSubNav } from "@/lib/nav";

function OpenShoppingStrip({
  groceries,
  updating,
  runAction,
  className = "mt-4",
}: {
  groceries: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
  updating: boolean;
  runAction: (action: () => Promise<{ ok: boolean; message: string }>) => void;
  className?: string;
}) {
  const groceryOpen = groceries.filter((item) => !item.is_checked);
  if (!groceryOpen.length) return null;

  return (
    <Panel
      title="Shopping list"
      className={className}
      right={
        <Link href="/dashboard/groceries" className="text-[11px] font-black text-accent hover:underline">
          Open list
        </Link>
      }
    >
      <div className="space-y-2">
        {groceryOpen.slice(0, 8).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-ink/6 bg-panel/60 px-4 py-3"
          >
            <button
              type="button"
              disabled={updating}
              onClick={() => runAction(() => toggleGroceryItem(item.id, true))}
              className="grid size-8 place-items-center rounded-lg border border-ink/15 text-muted"
              aria-label={`Check off ${item.name}`}
            >
              <Check size={14} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.name}</p>
              {item.quantity ? <p className="text-xs text-muted">{item.quantity}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export type PantryMode = "overview" | "items" | "categories" | "low-stock" | "add";

function usePantryActions() {
  const { pending, submit } = useModuleAction(addPantryItem);
  const [updating, startUpdate] = useTransition();

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    return new Promise<boolean>((resolve) => {
      startUpdate(async () => {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        resolve(result.ok);
      });
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
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form
        className="grid gap-2 rounded-2xl border border-accent/20 bg-accent-soft/40 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("id", String(item.id));
          runAction(async () => {
            const result = await updatePantryItem(formData);
            if (result.ok) setEditing(false);
            return result;
          });
        }}
      >
        <input name="name" defaultValue={item.name} required className={fieldClass} />
        <select name="category" defaultValue={item.category} className={fieldClass}>
          {PANTRY_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="stock_level" value={item.stock_level} />
        <div className="flex gap-2">
          <PrimaryButton disabled={updating} className="rounded-full px-4">
            {updating ? "Saving…" : "Save"}
          </PrimaryButton>
          <button type="button" onClick={() => setEditing(false)} className="text-xs font-black text-muted">
            Cancel
          </button>
        </div>
      </form>
    );
  }
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
          onClick={() => setEditing(true)}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent/15 hover:text-accent"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil size={14} />
        </button>
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
          onClick={async () => {
            if (!(await confirmDelete(item.name))) return;
            runAction(() => deletePantryItem(item.id));
          }}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {item.stock_level <= LOW_STOCK_THRESHOLD && (
        <button
          type="button"
          disabled={updating}
          onClick={() => runAction(() => addPantryItemToGroceryList(item.id))}
          className="mb-3 w-full rounded-xl border border-ink/10 bg-panel py-1.5 text-[11px] font-black text-accent"
        >
          Add to shopping list
        </button>
      )}
      <Progress value={item.stock_level} />
    </div>
  );
}

function PantryOverview({
  items,
  listOrder = [],
}: {
  items: PantryItem[];
  listOrder?: number[];
}) {
  const { updating, runAction } = usePantryActions();
  const { items: orderedItems } = useSavedListOrder("pantry", items, listOrder);
  const lowStock = orderedItems.filter((item) => item.stock_level <= LOW_STOCK_THRESHOLD);
  const categories = new Set(orderedItems.map((item) => item.category)).size;
  const wellStocked = items.filter((item) => item.stock_level > LOW_STOCK_THRESHOLD).length;

  return (
    <>
      <PageHeader
        eyebrow="KITCHEN · PANTRY"
        title="Know what you"
        highlight="have."
        action={items.length > 0 ? <ShareExportMenu compact doc={pantryDoc(items)} /> : undefined}
      />
      <ModuleSubNav items={kitchenSubNav} />

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Items tracked"
            value={String(items.length)}
            detail="In your pantry"
            icon={Refrigerator}
            tone="brand"
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
            tone="warn"
          />
          <StatCard
            label="Categories"
            value={String(categories)}
            detail={`${wellStocked} item${wellStocked === 1 ? "" : "s"} well stocked`}
            icon={Tags}
            tone="soft"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            {
              href: "/dashboard/pantry/sheet",
              title: "Sheet view",
              detail: "Excel-style stock table",
              icon: LayoutDashboard,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              title={card.detail}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-ink/8 bg-card px-4 py-3.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md"
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
          className="mt-8"
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
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-black text-ember">{item.stock_level}%</span>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => runAction(() => addPantryItemToGroceryList(item.id))}
                      className="rounded-full border border-ink/12 px-2.5 py-1 text-[10px] font-black text-accent"
                    >
                      Add to list
                    </button>
                  </div>
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
              href="/dashboard/pantry/sheet"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              Open sheet
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

function PantryItems({
  items,
  groceries = [],
  listOrder = [],
}: {
  items: PantryItem[];
  groceries?: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
  listOrder?: number[];
}) {
  const { updating, runAction } = usePantryActions();
  const { items: orderedItems, move } = useSavedListOrder("pantry", items, listOrder);
  const [entryMode, setEntryMode] = useEntryMode("pantry-items", "form");

  return (
    <>
      <PageHeader
        eyebrow="PANTRY"
        title="Full"
        highlight="inventory."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 && <ShareExportMenu compact doc={pantryDoc(items)} />}
            <Link href="/dashboard/pantry/sheet" className="text-xs font-black text-accent">
              Sheet →
            </Link>
            <Link href="/dashboard/pantry/add" className="inline-flex">
              <PrimaryButton className="rounded-full px-5">Add item</PrimaryButton>
            </Link>
          </div>
        }
      />
      <ModuleSubNav items={kitchenSubNav} />
      <OpenShoppingStrip groceries={groceries} updating={updating} runAction={runAction} className="mb-4" />
      <EntryModeToggle value={entryMode} onChange={setEntryMode} />

      {entryMode === "sheet" ? (
        <PantrySheet items={orderedItems} embedded />
      ) : entryMode === "paste" ? (
        <Panel title="Paste pantry items" className="mb-4">
          <QuickListPaste
            pending={updating}
            placeholder={"brown rice\neggs\nmilk"}
            hint="One name per line. Category and stock fill in if you skip them."
            onSubmit={(text) => runAction(() => addPantryItemsBulk(text))}
          />
        </Panel>
      ) : null}

      {entryMode !== "sheet" && (
      <Panel
        title="Stock levels"
        right={items.length > 0 ? <ShareExportMenu compact doc={pantryDoc(items)} /> : undefined}
      >
        <div className="space-y-4">
          {orderedItems.map((item, index) => (
            <ItemDragRow key={item.id} index={index} onMove={move}>
              <div className="flex items-start gap-1">
                <DragGrip label={`Reorder ${item.name}`} />
                <div className="min-w-0 flex-1">
                  <StockRow item={item} updating={updating} runAction={runAction} />
                </div>
              </div>
            </ItemDragRow>
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
      )}
    </>
  );
}

function PantryCategories({
  items,
  groceries = [],
}: {
  items: PantryItem[];
  groceries?: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
}) {
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
      <ModuleSubNav items={kitchenSubNav} />
      <OpenShoppingStrip groceries={groceries} updating={updating} runAction={runAction} className="mb-4" />

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

function PantryLowStock({
  items,
  groceries = [],
  listOrder = [],
}: {
  items: PantryItem[];
  groceries?: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
  listOrder?: number[];
}) {
  const { updating, runAction } = usePantryActions();
  const { items: orderedItems } = useSavedListOrder("pantry", items, listOrder);
  const lowStock = orderedItems
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
      <ModuleSubNav items={kitchenSubNav} />
      <OpenShoppingStrip groceries={groceries} updating={updating} runAction={runAction} className="mb-4" />

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

function PantryAdd({
  defaultCategory,
  items = [],
  groceries = [],
}: {
  defaultCategory?: string;
  items?: PantryItem[];
  groceries?: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
}) {
  const { pending, submit, updating, runAction } = usePantryActions();
  const [entryMode, setEntryMode] = useEntryMode("pantry-add");
  const lowStock = items.filter((item) => item.stock_level <= LOW_STOCK_THRESHOLD);

  return (
    <>
      <PageHeader
        eyebrow="PANTRY"
        title="Add to the"
        highlight="shelf."
        action={
          <Link href="/dashboard/pantry/sheet" className="text-xs font-black text-accent">
            Open sheet →
          </Link>
        }
      />
      <ModuleSubNav items={kitchenSubNav} />
      <EntryModeToggle value={entryMode} onChange={setEntryMode} />

      {entryMode === "form" && (
        <Panel title="New pantry item">
          <PantryAddForm pending={pending} submit={submit} defaultCategory={defaultCategory} />
        </Panel>
      )}
      {entryMode === "paste" && (
        <Panel title="Paste pantry items">
          <QuickListPaste
            pending={updating}
            placeholder={"brown rice\neggs\nmilk"}
            hint="One name per line. Optional category or stock % after a comma."
            onSubmit={(text) => runAction(() => addPantryItemsBulk(text))}
          />
        </Panel>
      )}
      {entryMode === "sheet" && <PantrySheet items={items} embedded />}

      {lowStock.length > 0 && (
        <Panel title="Already running low" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={updating}
                onClick={() => runAction(() => addPantryItemToGroceryList(item.id))}
                className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-bold text-muted"
              >
                {item.name} · {item.stock_level}% · add to list
              </button>
            ))}
          </div>
        </Panel>
      )}

      <OpenShoppingStrip groceries={groceries} updating={updating} runAction={runAction} />
    </>
  );
}

export function PantryView({
  mode = "overview",
  items,
  groceries = [],
  defaultCategory,
  listOrder = [],
}: {
  mode?: PantryMode;
  items: PantryItem[];
  groceries?: { id: number; name: string; quantity: string | null; is_checked: boolean }[];
  defaultCategory?: string;
  listOrder?: number[];
}) {
  if (mode === "items") return <PantryItems items={items} groceries={groceries} listOrder={listOrder} />;
  if (mode === "categories") return <PantryCategories items={items} groceries={groceries} />;
  if (mode === "low-stock") return <PantryLowStock items={items} groceries={groceries} listOrder={listOrder} />;
  if (mode === "add") return <PantryAdd defaultCategory={defaultCategory} items={items} groceries={groceries} />;
  return <PantryOverview items={items} listOrder={listOrder} />;
}
