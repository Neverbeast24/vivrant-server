"use client";

import { HeartPulse, TrendingDown, WalletCards } from "lucide-react";
import { addExpense } from "@/app/dashboard/spending/actions";
import { PageHeader, Panel, Stagger, StatCard } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  spent_at: string;
};

export function SpendingView({ expenses }: { expenses: Expense[] }) {
  const { pending, submit } = useModuleAction(addExpense);
  const total = expenses.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <>
      <PageHeader eyebrow="SPENDING" title="Invest in" highlight="wellbeing." />

      <Panel title="Add expense" className="mb-4">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input name="title" required placeholder="Expense title" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm sm:col-span-2" />
          <select name="category" defaultValue="food" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm">
            <option value="food">Food</option>
            <option value="fitness">Fitness</option>
            <option value="supplements">Supplements</option>
            <option value="wellness">Wellness</option>
            <option value="other">Other</option>
          </select>
          <input name="amount" type="number" min={0} step="0.01" required placeholder="Amount" className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm" />
          <button disabled={pending} className="rounded-2xl bg-[#24212e] px-4 py-3 text-sm font-bold text-white sm:col-span-2 lg:col-span-4">
            {pending ? "Saving…" : "Add expense"}
          </button>
        </form>
      </Panel>

      <Stagger>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Health investment"
            value={`₱${total.toLocaleString()}`}
            detail={`${expenses.length} expenses`}
            icon={WalletCards}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Budget left"
            value="₱600"
            suffix="/ ₱2,000"
            detail="30% remaining"
            icon={TrendingDown}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Investment index"
            value="88"
            detail="Smarter than last month"
            icon={HeartPulse}
            className="bg-[#fff3e8] text-[#533621]"
          />
        </div>

        <Panel title="Recent expenses" className="mt-4">
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{expense.title}</p>
                  <p className="text-xs capitalize text-[#847f8c]">{expense.category}</p>
                </div>
                <span className="text-xs font-black">₱{Number(expense.amount).toLocaleString()}</span>
              </div>
            ))}
            {!expenses.length && <p className="text-sm text-[#9a95a0]">No expenses yet.</p>}
          </div>
        </Panel>
      </Stagger>
    </>
  );
}
