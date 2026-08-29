"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  FileBarChart,
  Package,
  ShoppingBasket,
  Pencil,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { confirmAction, confirmDelete } from "@/components/dashboard/confirm-dialog";
import {
  archiveSelected,
  BulkBar,
  SelectableRow,
  SelectCheck,
  SelectModeButton,
  useBulkSelect,
} from "@/components/dashboard/bulk-select";
import {
  addGroceryItem,
  addGroceryItemsBulk,
  clearCompletedGroceries,
  deleteGroceryItem,
  toggleGroceryItem,
  updateGroceryItem,
} from "@/app/dashboard/groceries/actions";
import {
  addPlanItemsToList,
  estimateItemCostWithAi,
  generateSmartGroceryPlan,
} from "@/app/dashboard/groceries/ai-actions";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
import { EntryModeToggle, useEntryMode } from "@/components/dashboard/entry-mode-toggle";
import { QuickListPaste } from "@/components/dashboard/quick-list-paste";
import {
  Bars,
  EmptyState,
  FormField,
  ModuleJumpLinks,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { groceryListDoc, groceryPlanDoc } from "@/lib/share-export";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { DragGrip, ItemDragRow } from "@/components/dashboard/drag-list";
import { useSavedListOrder } from "@/components/dashboard/use-saved-list-order";
import {
  formatPhp,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";
import { kitchenSubNav } from "@/lib/nav";
import { GROCERY_CATEGORY_META as CATEGORY_META, GROCERY_CATEGORY_ORDER as CATEGORY_ORDER } from "@/lib/groceries/categories";
import { toast } from "sonner";
import { addLowStockToGroceryList } from "@/app/dashboard/pantry/actions";
import type { PantryItem } from "@/app/dashboard/pantry/shared";
import { LOW_STOCK_THRESHOLD } from "@/app/dashboard/pantry/shared";

type GroceryItem = {
  id: number;
  name: string;
  quantity: string | null;
  category: string | null;
  is_checked: boolean;
  estimated_price: number | null;
  price_low?: number | null;
  price_high?: number | null;
};

type Plan = {
  title: string;
  summary: string;
  meals: string[];
  items: { name: string; category: string; quantity: string; estimated_price: number }[];
  estimated_total: number;
  budget_note: string;
};

type StapleTrend = {
  label: string;
  items: { name: string; price: number }[];
};

const STAPLE_COLORS: Record<string, string> = {
  rice: "#0e7c66",
  chicken: "#2a9d8f",
  eggs: "#3db896",
  milk: "#4ec4b6",
  onion: "#5a8a6b",
  tomato: "#0a5c4c",
};

export function GroceriesView({
  items,
  monthlyBudget = 2000,
  spentThisMonth = 0,
  priceMonthLabel,
  stapleTrends = [],
  lowStock = [],
  listOrder = [],
  section = "list",
}: {
  items: GroceryItem[];
  monthlyBudget?: number;
  spentThisMonth?: number;
  priceMonthLabel?: string;
  stapleTrends?: StapleTrend[];
  lowStock?: Pick<PantryItem, "id" | "name" | "stock_level" | "category">[];
  listOrder?: number[];
  section?: "list" | "add" | "plan" | "insights";
}) {
  const { pending, submit } = useModuleAction(addGroceryItem);
  const [entryMode, setEntryMode] = useEntryMode("groceries");
  const [togglePending, startToggle] = useTransition();
  const [planning, startPlan] = useTransition();
  const [estimating, startEstimate] = useTransition();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("produce");
  const [price, setPrice] = useState("");
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [trendStaple, setTrendStaple] = useState("rice");
  const [editingId, setEditingId] = useState<number | null>(null);
  const { items: orderedItems, move } = useSavedListOrder("groceries", items, listOrder);
  const bulk = useBulkSelect(orderedItems.map((item) => item.id));
  const addMode = entryMode === "paste" ? "paste" : "form";
  const headings = {
    list: { title: "Shop", highlight: "smarter." },
    add: { title: "Add to", highlight: "your list." },
    plan: { title: "Plan", highlight: "the shop." },
    insights: { title: "Prices", highlight: "& budget." },
  } as const;
  const jumps = (
    [
      { href: "/dashboard/groceries", title: "Shopping list", icon: ShoppingBasket },
      { href: "/dashboard/groceries/add", title: "Add items", icon: Package },
      { href: "/dashboard/groceries/sheet", title: "Sheet view", icon: FileBarChart },
      { href: "/dashboard/groceries/plan", title: "AI meal + list", icon: Sparkles },
      { href: "/dashboard/groceries/insights", title: "Prices & budget", icon: TrendingUp },
    ] as const
  ).filter((item) => {
    if (section === "list") return item.href !== "/dashboard/groceries";
    if (section === "add") return item.href !== "/dashboard/groceries/add";
    if (section === "plan") return item.href !== "/dashboard/groceries/plan";
    return item.href !== "/dashboard/groceries/insights";
  });

  const done = items.filter((item) => item.is_checked).length;
  const openItems = items.filter((item) => !item.is_checked);
  const listTotal = items.reduce((sum, item) => sum + Number(item.estimated_price ?? 0), 0);
  const openTotal = openItems.reduce((sum, item) => sum + Number(item.estimated_price ?? 0), 0);
  const remainingBudget = Math.max(0, monthlyBudget - spentThisMonth);
  const roomForList = remainingBudget - openTotal;
  const overBudget = roomForList < 0;

  const grouped = CATEGORY_ORDER.map((key) => ({
    key,
    ...CATEGORY_META[key],
    items: orderedItems.filter((item) => (item.category ?? "other") === key),
  })).filter((group) => group.items.length > 0);

  const categorySpend = useMemo(() => {
    return CATEGORY_ORDER.map((key) => {
      const total = items
        .filter((item) => (item.category ?? "other") === key)
        .reduce((sum, item) => sum + Number(item.estimated_price ?? 0), 0);
      return { key, total, ...CATEGORY_META[key] };
    })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const maxCategorySpend = Math.max(1, ...categorySpend.map((row) => row.total));

  const categoryBars: [string, number][] = useMemo(() => {
    if (!categorySpend.length) return [];
    return categorySpend.slice(0, 6).map((row) => [
      row.emoji,
      Math.max(8, Math.round((row.total / maxCategorySpend) * 100)),
    ]);
  }, [categorySpend, maxCategorySpend]);

  const trendBars: [string, number][] = useMemo(() => {
    if (!stapleTrends.length) return [];
    const prices = stapleTrends.map(
      (month) => month.items.find((i) => i.name === trendStaple)?.price ?? 0,
    );
    const max = Math.max(1, ...prices);
    return stapleTrends.map((month, index) => [
      month.label,
      Math.max(8, Math.round((prices[index] / max) * 100)),
    ]);
  }, [stapleTrends, trendStaple]);

  const trendPrices = stapleTrends.map(
    (month) => month.items.find((i) => i.name === trendStaple)?.price ?? 0,
  );
  const latestTrend = trendPrices[trendPrices.length - 1] ?? 0;
  const firstTrend = trendPrices[0] ?? 0;
  const trendDelta = firstTrend > 0 ? Math.round(((latestTrend - firstTrend) / firstTrend) * 100) : 0;

  function onNameChange(value: string) {
    setName(value);
    const guessed = suggestGroceryCategory(value);
    if (value.trim().length >= 3) {
      setCategory(guessed);
    }
  }

  function toggle(id: number, checked: boolean) {
    startToggle(async () => {
      const result = await toggleGroceryItem(id, checked);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    return new Promise<boolean>((resolve) => {
      startToggle(async () => {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        resolve(result.ok);
      });
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

  function runAiCost() {
    if (!name.trim()) {
      toast.error("Enter an item name first.");
      return;
    }
    startEstimate(async () => {
      const result = await estimateItemCostWithAi({
        name: name.trim(),
        quantity: quantity || undefined,
        category,
      });
      if (!result.ok || !("estimate" in result) || !result.estimate) {
        toast.error(result.message);
        return;
      }
      const { estimate } = result;
      setCategory(estimate.category);
      setPrice(String(estimate.estimated_price));
      setAiTip(
        `${estimate.store_tip} · band ${formatPhp(estimate.low)}–${formatPhp(estimate.high)} · ${estimate.confidence} confidence`,
      );
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="KITCHEN · SHOPPING"
        title={headings[section].title}
        highlight={headings[section].highlight}
        action={
          section === "list" && items.length > 0 ? (
            <ShareExportMenu compact doc={groceryListDoc(items)} />
          ) : section === "plan" ? (
            <PrimaryButton disabled={planning} onClick={buildPlan} className="rounded-full px-5">
              <Sparkles size={14} className="shrink-0" />
              {planning ? "Planning…" : "Build meal + list"}
            </PrimaryButton>
          ) : undefined
        }
      />
      <p className="-mt-4 mb-6 max-w-xl text-sm text-muted">
        {section === "add"
          ? "Name is enough. Category and price fill in for you — or paste a whole list."
          : section === "plan"
            ? "Get a meal idea and shopping list from what you already eat and stock."
            : section === "insights"
              ? "See how this list sits against your monthly health budget."
              : "Check items off as you shop. Add more on its own page when you need it."}
      </p>
      <ModuleSubNav items={kitchenSubNav} />
      <ModuleJumpLinks items={jumps} />

      {section === "list" && lowStock.length > 0 && (
        <Panel
          title="Low in pantry"
          className="mb-4"
          right={
            <PrimaryButton
              disabled={togglePending}
              onClick={() => runAction(addLowStockToGroceryList)}
              className="rounded-full px-4 py-2 text-xs"
            >
              Add all to list
            </PrimaryButton>
          }
        >
          <p className="mb-3 text-xs text-muted">
            These pantry items are at or below {LOW_STOCK_THRESHOLD}%. Checking them off shopping
            restocks the shelf.
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 12).map((item) => {
              const onList = items.some(
                (g) => !g.is_checked && g.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
              );
              return (
                <span
                  key={item.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    onList
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-ink/10 bg-surface text-muted"
                  }`}
                >
                  {item.name} · {item.stock_level}%{onList ? " · on list" : ""}
                </span>
              );
            })}
          </div>
        </Panel>
      )}

      {section === "plan" && plan && (
        <Panel
          title={plan.title}
          className="mb-4"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <ShareExportMenu compact doc={groceryPlanDoc(plan)} />
              <Sparkles size={16} className="text-accent" />
            </div>
          }
        >
          <p className="text-sm leading-6 text-muted">{plan.summary}</p>
          <p className="mt-2 text-xs font-bold text-accent">
            {plan.budget_note} · plan total {formatPhp(plan.estimated_total)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plan.meals.map((meal) => (
              <div key={meal} className="rounded-xl border border-ink/8 bg-surface/50 px-3 py-2 text-xs font-bold">
                {meal}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {plan.items.map((item) => (
              <div
                key={`${item.name}-${item.quantity}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/5 bg-panel/70 px-3 py-2 text-sm"
              >
                <span className="font-bold">{item.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {CATEGORY_META[item.category]?.emoji ?? "🛒"} {item.quantity} ·{" "}
                  <span className="font-bold text-ink">{formatPhp(item.estimated_price)}</span>
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

      {section === "plan" && !plan && (
        <Panel title="Build a list from meals" className="mb-8">
          <p className="text-sm leading-6 text-muted">
            VIVRΛNT looks at your pantry, meals, and budget, then suggests a shop. You can add the
            whole list in one tap.
          </p>
          <PrimaryButton disabled={planning} onClick={buildPlan} className="mt-5 rounded-full px-5">
            <Sparkles size={14} className="shrink-0" />
            {planning ? "Planning…" : "Build meal + list"}
          </PrimaryButton>
        </Panel>
      )}

      {section === "add" && (
      <>
      <EntryModeToggle
        value={addMode}
        onChange={setEntryMode}
        modes={["form", "paste"]}
      />

      {addMode === "form" && (
      <Panel title="Add grocery item" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Grocery item" hint="Required" className="sm:col-span-2 lg:col-span-2">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Purefoods hotdog"
              className={fieldClass}
            />
          </FormField>
          <FormField label="Category" hint="Auto from name">
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_META[key].emoji} {CATEGORY_META[key].label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity">
            <input
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1 pack / 500g"
              className={fieldClass}
            />
          </FormField>
          <FormField label="Est. price (₱)" hint="AI or catalog">
            <input
              name="estimated_price"
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Auto"
              className={fieldClass}
            />
          </FormField>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-5 sm:flex-row">
            <PrimaryButton
              type="button"
              disabled={estimating || !name.trim()}
              onClick={runAiCost}
              className="sm:flex-1 bg-accent text-accent-fg hover:bg-accent-deep"
            >
              <Sparkles size={14} className="shrink-0" />
              {estimating ? "Pricing…" : "AI cost estimate"}
            </PrimaryButton>
            <PrimaryButton disabled={pending} className="sm:flex-1">
              {pending ? "Saving…" : "Add item"}
            </PrimaryButton>
          </div>
        </form>
        {aiTip && (
          <p className="mt-3 rounded-xl border border-accent/20 bg-accent-soft/60 px-3 py-2 text-xs font-semibold leading-5 text-ink">
            {aiTip}
          </p>
        )}
      </Panel>
      )}

      {addMode === "paste" && (
        <Panel title="Paste a grocery list" className="mb-4">
          <QuickListPaste
            pending={togglePending}
            placeholder={"eggs\nmilk, 1L\nrice, 5kg, grains"}
            hint="One name per line. Skip category and price if you want — we’ll fill those in."
            onSubmit={(text) => runAction(() => addGroceryItemsBulk(text))}
          />
        </Panel>
      )}
      </>
      )}

      {section === "insights" && (
      <Stagger>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="List progress"
            value={`${done}/${items.length}`}
            detail="Items checked off"
            icon={ShoppingBasket}
            tone="brand"
          />
          <StatCard
            label="Open list"
            value={formatPhp(openTotal)}
            detail={
              priceMonthLabel
                ? `PH prices · ${priceMonthLabel}`
                : `All items ${formatPhp(listTotal)}`
            }
            icon={Package}
            tone="soft"
          />
          <StatCard
            label="Budget left"
            value={formatPhp(remainingBudget)}
            detail={
              priceMonthLabel
                ? `of ${formatPhp(monthlyBudget)} · ${priceMonthLabel}`
                : `of ${formatPhp(monthlyBudget)} this month`
            }
            icon={Wallet}
            tone="warn"
          />
          <StatCard
            label={overBudget ? "Over allotment" : "Room for list"}
            value={formatPhp(Math.abs(roomForList))}
            detail={overBudget ? "Trim items or raise budget" : "After open list estimate"}
            icon={Wallet}
            tone={overBudget ? "warn" : "surface"}
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Panel
            title="Spend by category"
            right={
              <span className="text-[10px] font-bold text-muted">
                List total {formatPhp(listTotal)}
              </span>
            }
          >
            {categoryBars.length ? (
              <>
                <Bars data={categoryBars} />
                <div className="mt-5 space-y-3">
                  {categorySpend.map((row) => (
                    <div key={row.key}>
                      <div className="mb-1.5 flex justify-between text-xs font-bold">
                        <span>
                          {row.emoji} {row.label}
                        </span>
                        <span className="text-muted">{formatPhp(row.total)}</span>
                      </div>
                      <Progress value={(row.total / maxCategorySpend) * 100} className={row.color} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState>Add items to see category spend.</EmptyState>
            )}
          </Panel>

          <Panel
            title="PH staple price trend"
            right={<TrendingUp size={16} className="text-accent" />}
          >
            <div className="mb-4 flex flex-wrap gap-1.5">
              {Object.keys(STAPLE_COLORS).map((staple) => (
                <button
                  key={staple}
                  type="button"
                  onClick={() => setTrendStaple(staple)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black capitalize transition ${
                    trendStaple === staple
                      ? "bg-inverse text-inverse-fg"
                      : "bg-surface text-muted hover:bg-ink/8"
                  }`}
                >
                  {staple}
                </button>
              ))}
            </div>
            {trendBars.length ? (
              <>
                <Bars
                  data={trendBars}
                  activeIndex={trendBars.length - 1}
                />
                <p className="mt-4 text-xs font-semibold leading-5 text-muted">
                  Mid-market {trendStaple} now ~{formatPhp(latestTrend)}
                  {trendDelta !== 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className={trendDelta > 0 ? "text-ember" : "text-accent"}>
                        {trendDelta > 0 ? "+" : ""}
                        {trendDelta}% vs 6 mo ago
                      </span>
                    </>
                  )}{" "}
                  · seasonality + ~4%/yr PH food inflation
                </p>
              </>
            ) : (
              <EmptyState>Trend data unavailable.</EmptyState>
            )}
          </Panel>
        </div>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="mt-8 rounded-[1.4rem] border border-ink/8 bg-gradient-to-br from-accent-soft via-card to-accent-soft p-6"
        >
          <Sparkles size={18} className="text-accent" />
          <p className="mt-4 text-sm font-bold leading-6">
            {overBudget
              ? `Your open list is about ${formatPhp(Math.abs(roomForList))} over remaining budget — swap premium picks or trim quantities before you shop.`
              : `Prices use ${priceMonthLabel ?? "this PH month"} mid-market bands (wet market → supermarket), auto-categorize items, and AI costing when you tap estimate — all inside your ${formatPhp(monthlyBudget)} monthly health budget.`}
          </p>
        </motion.article>
      </Stagger>
      )}

      {section === "list" && (
      <>
      <Panel title="Add one item" className="mb-8">
        <form action={submit} className="flex flex-col gap-3 sm:flex-row">
          <input name="name" required placeholder="e.g. eggs" className={fieldClass} />
          <input name="quantity" placeholder="qty (optional)" className={`${fieldClass} sm:max-w-40`} />
          <PrimaryButton disabled={pending} className="shrink-0 sm:w-auto">
            {pending ? "Adding…" : "Add"}
          </PrimaryButton>
        </form>
        <p className="mt-3 text-xs text-muted">
          Need a full form, paste, or Excel?{" "}
          <Link href="/dashboard/groceries/add" className="font-black text-accent hover:underline">
            Add items
          </Link>
          {" · "}
          <Link href="/dashboard/groceries/sheet" className="font-black text-accent hover:underline">
            Sheet view
          </Link>
        </p>
      </Panel>

      <div className="mb-6 flex flex-wrap gap-2">
        <PrimaryButton
          disabled={togglePending}
          onClick={() =>
            runAction(async () => {
              const { restockPantryFromChecked } = await import("@/app/dashboard/groceries/actions");
              return restockPantryFromChecked();
            })
          }
          className="rounded-full px-5"
        >
          <Package size={14} className="shrink-0" />
          Restock pantry from checked
        </PrimaryButton>
      </div>

        <Panel
          title="Shopping list"
          className="mb-8"
          right={
            <div className="flex flex-wrap items-center gap-2">
              {done > 0 ? (
                <button
                  type="button"
                  disabled={togglePending}
                  onClick={async () => {
                    if (
                      !(await confirmAction({
                        title: "Archive completed items?",
                        body: "Checked groceries will leave this list and move to Archived.",
                        confirmLabel: "Archive",
                      }))
                    )
                      return;
                    runAction(clearCompletedGroceries);
                  }}
                  className="text-xs font-black text-accent transition hover:opacity-70"
                >
                  Clear {done} completed
                </button>
              ) : null}
              {orderedItems.length > 0 ? (
                <SelectModeButton selecting={bulk.selecting} onStart={bulk.start} onCancel={bulk.clear} />
              ) : null}
            </div>
          }
        >
          <div className="space-y-5">
            <BulkBar
              selecting={bulk.selecting}
              count={bulk.count}
              total={orderedItems.length}
              allSelected={bulk.allSelected}
              onSelectAll={bulk.allSelected ? bulk.deselectAll : bulk.selectAll}
              onClear={bulk.clear}
              pending={togglePending}
              onConfirm={() =>
                startToggle(async () => {
                  const ok = await archiveSelected("grocery_items", bulk.selectedIds);
                  if (ok) bulk.clear();
                })
              }
            />
            {grouped.map((group) => {
              const groupDone = group.items.filter((item) => item.is_checked).length;
              const groupTotal = group.items.reduce(
                (sum, item) => sum + Number(item.estimated_price ?? 0),
                0,
              );
              return (
                <section key={group.key}>
                  <header className="mb-2 flex items-center justify-between px-1">
                    <p className="flex items-center gap-2 text-xs font-black tracking-wide text-muted">
                      <span className="text-sm leading-none">{group.emoji}</span>
                      {group.label.toUpperCase()}
                    </p>
                    <span className="text-[10px] font-bold text-muted">
                      {groupDone}/{group.items.length} · {formatPhp(groupTotal)}
                    </span>
                  </header>
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {group.items.map((item) => (
                        editingId === item.id ? (
                          <form
                            key={item.id}
                            className="grid gap-2 rounded-2xl border border-accent/20 bg-accent-soft/40 p-3 sm:grid-cols-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              formData.set("id", String(item.id));
                              runAction(async () => {
                                const result = await updateGroceryItem(formData);
                                if (result.ok) setEditingId(null);
                                return result;
                              });
                            }}
                          >
                            <input name="name" defaultValue={item.name} required className={fieldClass} />
                            <input name="quantity" defaultValue={item.quantity ?? ""} className={fieldClass} placeholder="qty" />
                            <select name="category" defaultValue={item.category ?? "other"} className={fieldClass}>
                              {CATEGORY_ORDER.map((key) => (
                                <option key={key} value={key}>{CATEGORY_META[key].label}</option>
                              ))}
                            </select>
                            <input name="estimated_price" type="number" min={0} defaultValue={item.estimated_price ?? ""} className={fieldClass} />
                            <div className="flex gap-2 sm:col-span-2">
                              <PrimaryButton disabled={togglePending} className="rounded-full px-4">Save</PrimaryButton>
                              <button type="button" onClick={() => setEditingId(null)} className="text-xs font-black text-muted">Cancel</button>
                            </div>
                          </form>
                        ) : (
                        <SelectableRow
                          key={item.id}
                          id={item.id}
                          label={item.name}
                          selecting={bulk.selecting}
                          selected={bulk.selected.has(item.id)}
                          onToggle={bulk.toggle}
                          onArchive={async () => {
                            if (!(await confirmDelete(item.name))) return;
                            runAction(() => deleteGroceryItem(item.id));
                          }}
                        >
                        <ItemDragRow
                          index={orderedItems.findIndex((row) => row.id === item.id)}
                          onMove={move}
                        >
                        <motion.div
                          layout
                          className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition ${
                            bulk.selecting && bulk.selected.has(item.id)
                              ? "border-accent/35 bg-accent-soft/50"
                              : "border-ink/6 bg-surface/45 hover:border-ink/12 hover:bg-card"
                          }`}
                        >
                          {bulk.selecting ? (
                            <SelectCheck checked={bulk.selected.has(item.id)} />
                          ) : (
                            <DragGrip label={`Reorder ${item.name}`} />
                          )}
                          <button
                            type="button"
                            disabled={togglePending}
                            onClick={() => toggle(item.id, !item.is_checked)}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5"
                          >
                            <span
                              className={`grid size-6 place-items-center rounded-lg border-2 ${item.is_checked ? "border-accent bg-accent text-accent-fg" : "border-ink/20"}`}
                            >
                              {item.is_checked && <Check size={13} />}
                            </span>
                            <span
                              className={`min-w-0 flex-1 truncate text-left text-sm font-bold ${item.is_checked ? "text-muted line-through" : "text-ink"}`}
                            >
                              {item.name}
                            </span>
                          </button>
                          <span className="shrink-0 text-xs font-semibold text-muted">
                            {item.quantity ?? "—"}
                          </span>
                          <span className="w-20 shrink-0 text-right">
                            <span className="block text-xs font-black text-ink">
                              {formatPhp(Number(item.estimated_price ?? 0))}
                            </span>
                            {item.price_low != null && item.price_high != null && (
                              <span className="block text-[9px] font-semibold text-muted">
                                {formatPhp(item.price_low)}–{formatPhp(item.price_high)}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingId(item.id)}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-accent/15 hover:text-accent"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={togglePending}
                            onClick={async () => {
                              if (!(await confirmDelete(item.name))) return;
                              runAction(() => deleteGroceryItem(item.id));
                            }}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-ember/15 hover:text-ember"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                        </ItemDragRow>
                        </SelectableRow>
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              );
            })}
            {!items.length && <EmptyState>Your list is empty.</EmptyState>}
          </div>
        </Panel>
      </>
      )}
    </>
  );
}
