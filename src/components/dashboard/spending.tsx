"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDownAZ,
  Check,
  FileBarChart,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  addExpense,
  deleteExpense,
  saveMonthlyBudget,
  updateExpense,
} from "@/app/dashboard/spending/actions";
import { coachSpendingWithAi } from "@/app/dashboard/spending/ai-actions";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import {
  EmptyState,
  FormField,
  ListRow,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { spendingSubNav } from "@/lib/nav";

export type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  spent_at: string;
};

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "fitness", label: "Fitness" },
  { value: "supplements", label: "Supplements" },
  { value: "wellness", label: "Wellness" },
  { value: "other", label: "Other" },
] as const;

type SortKey = "spent_at" | "title" | "category" | "amount";

function money(value: number) {
  return `₱${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function categoryLabel(value: string) {
  return CATEGORIES.find((row) => row.value === value)?.label ?? value;
}

function useSpendingStats(expenses: Expense[], monthlyBudget: number) {
  const total = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const remaining = Math.max(0, monthlyBudget - total);
  const remainingPct = monthlyBudget > 0 ? Math.round((remaining / monthlyBudget) * 100) : 0;
  const overBudget = Math.max(0, total - monthlyBudget);
  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses
      .filter((row) => row.category === cat.value)
      .reduce((sum, row) => sum + Number(row.amount), 0),
    count: expenses.filter((row) => row.category === cat.value).length,
  })).filter((row) => row.count > 0);

  return {
    total,
    remaining,
    remainingPct,
    overBudget,
    byCategory,
    usedPct: monthlyBudget > 0 ? Math.min(100, Math.round((total / monthlyBudget) * 100)) : 0,
  };
}

function SpendingHeader({
  title,
  highlight,
  action,
}: {
  title: string;
  highlight?: string;
  action?: React.ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow="SPENDING" title={title} highlight={highlight} action={action} />
      <ModuleSubNav items={spendingSubNav} />
    </>
  );
}

function ExpenseForm({
  today,
  pending,
  submit,
  submitLabel,
}: {
  today: string;
  pending: boolean;
  submit: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <FormField label="Expense" hint="Required" className="sm:col-span-2">
        <input name="title" required placeholder="e.g. Weekly groceries" className={fieldClass} />
      </FormField>
      <FormField label="Category">
        <select name="category" defaultValue="food" className={fieldClass}>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Amount" hint="PHP">
        <input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          required
          placeholder="0.00"
          className={fieldClass}
        />
      </FormField>
      <FormField label="Date">
        <input name="spent_at" type="date" required defaultValue={today} className={fieldClass} />
      </FormField>
      <PrimaryButton disabled={pending} className="sm:col-span-2 lg:col-span-5">
        {pending ? "Saving…" : submitLabel}
      </PrimaryButton>
    </form>
  );
}

export function SpendingOverview({
  expenses,
  monthlyBudget = 2000,
  today,
}: {
  expenses: Expense[];
  monthlyBudget?: number;
  today: string;
}) {
  const [coaching, startCoach] = useTransition();
  const [advice, setAdvice] = useState<{
    title: string;
    body: string;
    swap: string;
    score: number;
  } | null>(null);
  const stats = useSpendingStats(expenses, monthlyBudget);

  function coach() {
    startCoach(async () => {
      const result = await coachSpendingWithAi();
      if (!result.ok || !("advice" in result) || !result.advice) {
        toast.error(result.message);
        return;
      }
      setAdvice(result.advice);
      toast.success(result.message);
    });
  }

  return (
    <>
      <SpendingHeader
        title="Monthly"
        highlight="budget."
        action={
          <PrimaryButton disabled={coaching} onClick={coach} className="rounded-full px-5">
            <Sparkles size={14} className="shrink-0" />
            {coaching ? "Coaching…" : "Budget coach"}
          </PrimaryButton>
        }
      />

      {advice && (
        <Panel
          title={advice.title}
          className="mb-4"
          right={<span className="text-xs font-black text-accent">{advice.score}/100</span>}
        >
          <p className="text-sm leading-6 text-muted">{advice.body}</p>
          <p className="mt-3 rounded-xl bg-accent-soft/80 px-3 py-2 text-xs font-bold text-accent">
            This week’s swap: {advice.swap}
          </p>
        </Panel>
      )}

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Spent this month"
            value={money(stats.total)}
            detail={`${expenses.length} expenses`}
            icon={WalletCards}
            className="bg-gradient-to-br from-accent-deep to-accent text-white"
          />
          <StatCard
            label="Monthly budget"
            value={money(monthlyBudget)}
            detail={`${stats.usedPct}% used`}
            icon={Target}
            className="bg-ember/10 text-ember"
          />
          <StatCard
            label="Left this month"
            value={money(stats.remaining)}
            detail={
              stats.overBudget > 0
                ? `${money(stats.overBudget)} over budget`
                : `${stats.remainingPct}% remaining`
            }
            icon={TrendingDown}
            className="bg-accent-soft text-accent-deep"
          />
        </div>

        <Panel title="Monthly budget progress" className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted">
            <span>{stats.usedPct}% of {money(monthlyBudget)}</span>
            <span>{money(stats.total)} spent</span>
          </div>
          <Progress
            value={stats.usedPct}
            className={
              stats.overBudget > 0 ? "from-accent-deep to-accent" : "from-accent to-cyan"
            }
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/spending/budget" className="inline-flex">
              <PrimaryButton className="rounded-full px-5">Edit monthly budget</PrimaryButton>
            </Link>
            <Link
              href="/dashboard/spending/sheet"
              className="inline-flex items-center rounded-full border border-ink/12 bg-panel/70 px-5 py-3 text-xs font-black text-muted transition hover:border-accent/30 hover:text-accent"
            >
              Open sheet view
            </Link>
          </div>
        </Panel>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            {
              href: "/dashboard/spending/log",
              title: "Log expense",
              detail: "Add a purchase to this month",
              icon: Plus,
            },
            {
              href: "/dashboard/spending/sheet",
              title: "Sheet view",
              detail: "Browse and edit like a spreadsheet",
              icon: FileBarChart,
            },
            {
              href: "/dashboard/spending/budget",
              title: "Monthly budget",
              detail: `Currently ${money(monthlyBudget)} / month`,
              icon: Target,
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
          title="Recent expenses"
          className="mt-4"
          right={
            <Link href="/dashboard/spending/sheet" className="text-xs font-black text-accent">
              Full sheet →
            </Link>
          }
        >
          <div className="space-y-2">
            {expenses.slice(0, 8).map((expense) => (
              <ListRow
                key={expense.id}
                title={expense.title}
                meta={`${categoryLabel(expense.category)} · ${expense.spent_at}`}
                right={
                  <span className="text-xs font-black">{money(Number(expense.amount))}</span>
                }
              />
            ))}
            {!expenses.length && <EmptyState>No expenses yet. Log your first purchase.</EmptyState>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}

export function SpendingLog({ today }: { today: string }) {
  const { pending, submit } = useModuleAction(addExpense);

  return (
    <>
      <SpendingHeader title="Log an" highlight="expense." />
      <Panel title="New expense">
        <ExpenseForm today={today} pending={pending} submit={submit} submitLabel="Add expense" />
      </Panel>
      <Panel title="Tip" className="mt-4">
        <p className="text-sm leading-6 text-muted">
          Logged expenses count toward your monthly budget. Open the sheet view when you need to
          scan or edit many rows at once.
        </p>
        <Link
          href="/dashboard/spending/sheet"
          className="mt-4 inline-flex text-xs font-black text-accent"
        >
          Open Excel-style sheet →
        </Link>
      </Panel>
    </>
  );
}

export function SpendingBudget({
  monthlyBudget,
  spentTotal,
}: {
  monthlyBudget: number;
  spentTotal: number;
}) {
  const { pending, submit } = useModuleAction(saveMonthlyBudget);
  const remaining = Math.max(0, monthlyBudget - spentTotal);
  const usedPct =
    monthlyBudget > 0 ? Math.min(100, Math.round((spentTotal / monthlyBudget) * 100)) : 0;

  return (
    <>
      <SpendingHeader title="Monthly" highlight="budget." />
      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Monthly budget"
            value={money(monthlyBudget)}
            detail="Your spending limit this month"
            icon={Target}
            className="bg-gradient-to-br from-accent-deep to-accent text-white"
          />
          <StatCard
            label="Spent so far"
            value={money(spentTotal)}
            detail={`${usedPct}% of monthly budget used`}
            icon={WalletCards}
            className="bg-ember/10 text-ember"
          />
          <StatCard
            label="Left this month"
            value={money(remaining)}
            detail={spentTotal > monthlyBudget ? "Over budget — consider adjusting" : "Still available"}
            icon={TrendingDown}
            className="bg-accent-soft text-accent-deep"
          />
        </div>

        <Panel title="Edit monthly budget" className="mt-4">
          <form action={submit} className="grid max-w-md gap-3">
            <FormField label="Monthly budget" hint="PHP / month">
              <input
                name="monthly_health_budget"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={monthlyBudget}
                className={fieldClass}
              />
            </FormField>
            <p className="text-xs leading-5 text-muted">
              Set how much you plan to spend this month. Expenses in Spending count against this
              amount.
            </p>
            <PrimaryButton disabled={pending}>
              {pending ? "Saving…" : "Save monthly budget"}
            </PrimaryButton>
          </form>
        </Panel>

        <Panel title="Quick presets" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {[1500, 2000, 3000, 5000, 8000, 10000].map((amount) => (
              <form key={amount} action={submit}>
                <input type="hidden" name="monthly_health_budget" value={amount} />
                <button
                  type="submit"
                  disabled={pending}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    amount === monthlyBudget
                      ? "bg-inverse text-inverse-fg"
                      : "bg-surface text-muted hover:bg-panel hover:text-ink"
                  }`}
                >
                  {money(amount)}
                </button>
              </form>
            ))}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}

type DraftRow = {
  title: string;
  category: string;
  amount: string;
  spent_at: string;
};

export function SpendingSheet({
  expenses,
  monthlyBudget,
  today,
}: {
  expenses: Expense[];
  monthlyBudget: number;
  today: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("spent_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [newRow, setNewRow] = useState<DraftRow>({
    title: "",
    category: "food",
    amount: "",
    spent_at: today,
  });
  const [pending, start] = useTransition();
  const stats = useSpendingStats(expenses, monthlyBudget);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = expenses.filter((row) => {
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter;
      const matchesQuery =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.spent_at.includes(q);
      return matchesCategory && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "amount") return (Number(a.amount) - Number(b.amount)) * dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
  }, [expenses, filter, categoryFilter, sortKey, sortAsc]);

  const visibleTotal = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((value) => !value);
    else {
      setSortKey(key);
      setSortAsc(key === "title" || key === "category");
    }
  }

  function beginEdit(expense: Expense) {
    setEditingId(expense.id);
    setDraft({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      spent_at: expense.spent_at.slice(0, 10),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit(id: number) {
    if (!draft) return;
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("title", draft.title.trim());
    formData.set("category", draft.category);
    formData.set("amount", draft.amount);
    formData.set("spent_at", draft.spent_at);
    start(async () => {
      const result = await updateExpense(formData);
      if (result.ok) {
        toast.success(result.message);
        cancelEdit();
      } else toast.error(result.message);
    });
  }

  function addRow() {
    const formData = new FormData();
    formData.set("title", newRow.title.trim());
    formData.set("category", newRow.category);
    formData.set("amount", newRow.amount);
    formData.set("spent_at", newRow.spent_at);
    start(async () => {
      const result = await addExpense(formData);
      if (result.ok) {
        toast.success(result.message);
        setNewRow({ title: "", category: "food", amount: "", spent_at: today });
      } else toast.error(result.message);
    });
  }

  function removeRow(id: number) {
    start(async () => {
      const result = await deleteExpense(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      if (editingId === id) cancelEdit();
    });
  }

  const cellInput =
    "h-9 w-full border-0 bg-transparent px-2 text-sm outline-none focus:bg-[#fffdf5] focus:ring-2 focus:ring-inset focus:ring-accent/25";

  const headerBtn =
    "inline-flex items-center gap-1 font-black uppercase tracking-[0.08em] text-[10px] text-[#3d5248]";

  return (
    <>
      <SpendingHeader
        title="Sheet"
        highlight="ledger."
        action={
          <Link href="/dashboard/spending/log" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">
              <Plus size={14} />
              Log expense
            </PrimaryButton>
          </Link>
        }
      />

      <Stagger>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-ink/8 bg-card px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted">Rows</p>
            <p className="mt-1 text-lg font-black">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-ink/8 bg-card px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted">
              Visible total
            </p>
            <p className="mt-1 text-lg font-black">{money(visibleTotal)}</p>
          </div>
          <div className="rounded-2xl border border-ink/8 bg-card px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted">Budget</p>
            <p className="mt-1 text-lg font-black">{money(monthlyBudget)}</p>
          </div>
          <div className="rounded-2xl border border-ink/8 bg-accent-soft px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted">Left</p>
            <p className="mt-1 text-lg font-black text-accent">{money(stats.remaining)}</p>
          </div>
        </div>

        <Panel
          title="Excel-style expense sheet"
          right={
            <span className="hidden text-[10px] font-bold text-muted sm:inline">
              Click a cell row to edit · Enter to save
            </span>
          }
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter by title, category, or date…"
              className={`${fieldClass} sm:max-w-sm`}
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={`${fieldClass} sm:max-w-[11rem]`}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#c5d0c4] bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
            <table className="min-w-[720px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#e4eee6]">
                  <th className="w-10 border-b border-r border-[#c5d0c4] px-2 py-2 text-center text-[10px] font-black text-muted">
                    #
                  </th>
                  {(
                    [
                      ["spent_at", "Date", "w-[8.5rem]"],
                      ["title", "Expense", ""],
                      ["category", "Category", "w-[9rem]"],
                      ["amount", "Amount (₱)", "w-[8rem]"],
                    ] as const
                  ).map(([key, label, width]) => (
                    <th
                      key={key}
                      className={`border-b border-r border-[#c5d0c4] px-2 py-2 ${width}`}
                    >
                      <button type="button" onClick={() => toggleSort(key)} className={headerBtn}>
                        {label}
                        <ArrowDownAZ
                          size={11}
                          className={sortKey === key ? "opacity-100" : "opacity-30"}
                        />
                      </button>
                    </th>
                  ))}
                  <th className="w-[7rem] border-b border-[#c5d0c4] px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#3d5248]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((expense, index) => {
                  const isEditing = editingId === expense.id && draft;
                  return (
                    <tr
                      key={expense.id}
                      className={`group border-b border-[#dce6dc] ${
                        index % 2 === 0 ? "bg-panel" : "bg-[#f7fbf8]"
                      } hover:bg-[#fff8e8]`}
                    >
                      <td className="border-r border-[#dce6dc] px-2 py-1.5 text-center text-[11px] font-bold text-[#9aaba1]">
                        {index + 1}
                      </td>
                      {isEditing ? (
                        <>
                          <td className="border-r border-[#dce6dc] p-0">
                            <input
                              type="date"
                              value={draft.spent_at}
                              onChange={(event) =>
                                setDraft({ ...draft, spent_at: event.target.value })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveEdit(expense.id);
                                if (event.key === "Escape") cancelEdit();
                              }}
                              className={cellInput}
                            />
                          </td>
                          <td className="border-r border-[#dce6dc] p-0">
                            <input
                              value={draft.title}
                              onChange={(event) =>
                                setDraft({ ...draft, title: event.target.value })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveEdit(expense.id);
                                if (event.key === "Escape") cancelEdit();
                              }}
                              className={cellInput}
                              autoFocus
                            />
                          </td>
                          <td className="border-r border-[#dce6dc] p-0">
                            <select
                              value={draft.category}
                              onChange={(event) =>
                                setDraft({ ...draft, category: event.target.value })
                              }
                              className={cellInput}
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border-r border-[#dce6dc] p-0">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={draft.amount}
                              onChange={(event) =>
                                setDraft({ ...draft, amount: event.target.value })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveEdit(expense.id);
                                if (event.key === "Escape") cancelEdit();
                              }}
                              className={`${cellInput} text-right font-bold`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => saveEdit(expense.id)}
                                className="grid size-7 place-items-center rounded-md bg-accent-soft text-accent"
                                aria-label="Save"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="grid size-7 place-items-center rounded-md bg-[#f0ebe4] text-[#7a6a60]"
                                aria-label="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="border-r border-[#dce6dc] px-2 py-2 text-sm tabular-nums text-[#4a5b52]">
                            {expense.spent_at.slice(0, 10)}
                          </td>
                          <td className="border-r border-[#dce6dc] px-2 py-2 text-sm font-semibold">
                            {expense.title}
                          </td>
                          <td className="border-r border-[#dce6dc] px-2 py-2 text-sm capitalize text-muted">
                            {categoryLabel(expense.category)}
                          </td>
                          <td className="border-r border-[#dce6dc] px-2 py-2 text-right text-sm font-black tabular-nums">
                            {Number(expense.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => beginEdit(expense)}
                                className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-accent"
                                aria-label={`Edit ${expense.title}`}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => removeRow(expense.id)}
                                className="grid size-7 place-items-center rounded-md text-muted hover:bg-ember/15 hover:text-ember"
                                aria-label={`Delete ${expense.title}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                      No rows match this filter. Add a purchase below.
                    </td>
                  </tr>
                )}

                <tr className="bg-[#eef6f0]">
                  <td className="border-r border-[#c5d0c4] px-2 py-2 text-center text-[10px] font-black text-accent">
                    +
                  </td>
                  <td className="border-r border-[#c5d0c4] p-0">
                    <input
                      type="date"
                      value={newRow.spent_at}
                      onChange={(event) => setNewRow({ ...newRow, spent_at: event.target.value })}
                      className={cellInput}
                    />
                  </td>
                  <td className="border-r border-[#c5d0c4] p-0">
                    <input
                      value={newRow.title}
                      onChange={(event) => setNewRow({ ...newRow, title: event.target.value })}
                      placeholder="New expense…"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addRow();
                      }}
                      className={cellInput}
                    />
                  </td>
                  <td className="border-r border-[#c5d0c4] p-0">
                    <select
                      value={newRow.category}
                      onChange={(event) => setNewRow({ ...newRow, category: event.target.value })}
                      className={cellInput}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-r border-[#c5d0c4] p-0">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newRow.amount}
                      onChange={(event) => setNewRow({ ...newRow, amount: event.target.value })}
                      placeholder="0.00"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addRow();
                      }}
                      className={`${cellInput} text-right font-bold`}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      disabled={pending || !newRow.title.trim() || !newRow.amount}
                      onClick={addRow}
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-inverse px-2.5 text-[10px] font-black text-inverse-fg disabled:opacity-50"
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-[#dfeae1]">
                  <td colSpan={4} className="border-t border-[#c5d0c4] px-3 py-2 text-right text-xs font-black uppercase tracking-wider text-muted">
                    Visible total
                  </td>
                  <td className="border-t border-r border-[#c5d0c4] px-2 py-2 text-right text-sm font-black tabular-nums">
                    {visibleTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border-t border-[#c5d0c4]" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        {stats.byCategory.length > 0 && (
          <Panel title="Category breakdown" className="mt-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byCategory.map((cat) => (
                <div
                  key={cat.value}
                  className="flex items-center justify-between rounded-2xl bg-surface/55 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-black">{cat.label}</p>
                    <p className="text-[11px] text-muted">
                      {cat.count} row{cat.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm font-black">{money(cat.total)}</p>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </Stagger>
    </>
  );
}

/** @deprecated Prefer named page views; kept for any leftover imports */
export function SpendingView(props: {
  expenses: Expense[];
  monthlyBudget?: number;
  today: string;
}) {
  return <SpendingOverview {...props} />;
}
