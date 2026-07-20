"use client";

import { useState, useTransition } from "react";
import { HeartPulse, Sparkles, Trash2, TrendingDown, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { addExpense, deleteExpense } from "@/app/dashboard/spending/actions";
import { coachSpendingWithAi } from "@/app/dashboard/spending/ai-actions";
import {
  EmptyState,
  FormField,
  ListRow,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  StatCard,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  spent_at: string;
};

export function SpendingView({
  expenses,
  monthlyBudget = 2000,
  today,
}: {
  expenses: Expense[];
  monthlyBudget?: number;
  today: string;
}) {
  const { pending, submit } = useModuleAction(addExpense);
  const [deleting, startDelete] = useTransition();
  const [coaching, startCoach] = useTransition();
  const [advice, setAdvice] = useState<{
    title: string;
    body: string;
    swap: string;
    score: number;
  } | null>(null);

  const total = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const remaining = Math.max(0, monthlyBudget - total);
  const remainingPct = monthlyBudget > 0 ? Math.round((remaining / monthlyBudget) * 100) : 0;
  const wellnessShare = expenses.filter((row) =>
    ["fitness", "supplements", "wellness"].includes(row.category),
  ).length;
  const investmentIndex = expenses.length
    ? Math.min(100, Math.round((wellnessShare / expenses.length) * 70 + remainingPct * 0.3))
    : 0;

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
      <PageHeader
        eyebrow="SPENDING"
        title="Invest in"
        highlight="wellbeing."
        action={
          <PrimaryButton disabled={coaching} onClick={coach} className="rounded-full px-5">
            <Sparkles size={14} className="mr-1.5" />
            {coaching ? "Coaching…" : "Budget coach"}
          </PrimaryButton>
        }
      />

      {advice && (
        <Panel title={advice.title} className="mb-4" right={<span className="text-xs font-black text-[#0e7c66]">{advice.score}/100</span>}>
          <p className="text-sm leading-6 text-[#55665d]">{advice.body}</p>
          <p className="mt-3 rounded-xl bg-[#d7efe6]/80 px-3 py-2 text-xs font-bold text-[#0e7c66]">
            This week’s swap: {advice.swap}
          </p>
        </Panel>
      )}

      <Panel title="Add expense" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Expense" hint="Required" className="sm:col-span-2">
            <input name="title" required placeholder="e.g. Weekly groceries" className={fieldClass} />
          </FormField>
          <FormField label="Category">
            <select name="category" defaultValue="food" className={fieldClass}>
              <option value="food">Food</option>
              <option value="fitness">Fitness</option>
              <option value="supplements">Supplements</option>
              <option value="wellness">Wellness</option>
              <option value="other">Other</option>
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
            {pending ? "Saving…" : "Add expense"}
          </PrimaryButton>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Health investment"
            value={`₱${total.toLocaleString()}`}
            detail={`${expenses.length} expenses`}
            icon={WalletCards}
            className="bg-gradient-to-br from-[#0a5c4c] to-[#0e7c66] text-white"
          />
          <StatCard
            label="Budget left"
            value={`₱${remaining.toLocaleString()}`}
            suffix={`/ ₱${monthlyBudget.toLocaleString()}`}
            detail={`${remainingPct}% remaining`}
            icon={TrendingDown}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Investment index"
            value={String(investmentIndex)}
            detail={
              expenses.length
                ? `${wellnessShare} wellness-focused expenses`
                : "Add an expense to score"
            }
            icon={HeartPulse}
            className="bg-[#fff3e8] text-[#533621]"
          />
        </div>

        <Panel title="Recent expenses" className="mt-4">
          <div className="space-y-2">
            {expenses.map((expense) => (
              <ListRow
                key={expense.id}
                title={expense.title}
                meta={expense.category}
                right={
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-black">
                      ₱{Number(expense.amount).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() =>
                        startDelete(async () => {
                          const result = await deleteExpense(expense.id);
                          if (result.ok) toast.success(result.message);
                          else toast.error(result.message);
                        })
                      }
                      className="grid size-8 place-items-center rounded-lg text-[#8a9a91] transition hover:bg-[#f8ece4] hover:text-[#c45c2a]"
                      aria-label={`Delete ${expense.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                }
              />
            ))}
            {!expenses.length && <EmptyState>No expenses yet.</EmptyState>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
