import { PageHeader, Panel, Stagger, StatCard } from "@/components/dashboard/ui";
import { Activity, WalletCards } from "lucide-react";

type ReportsViewProps = {
  checkins: number;
  expensesTotal: number;
  workouts: number;
  meals: number;
};

export function ReportsView({
  checkins,
  expensesTotal,
  workouts,
  meals,
}: ReportsViewProps) {
  return (
    <>
      <PageHeader eyebrow="REPORTS" title="Your weekly" highlight="story." />
      <Stagger>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            label="Check-ins"
            value={String(checkins)}
            detail="This month"
            icon={Activity}
            className="bg-gradient-to-br from-[#7055ed] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Meals logged"
            value={String(meals)}
            detail="This month"
            icon={Activity}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Workouts"
            value={String(workouts)}
            detail="This month"
            icon={Activity}
            className="bg-[#fff3e8] text-[#533621]"
          />
          <StatCard
            label="Health spend"
            value={`₱${expensesTotal.toLocaleString()}`}
            detail="This month"
            icon={WalletCards}
            className="bg-[#fdeaf1] text-[#5a2438]"
          />
        </div>
        <Panel title="Weekly insight" className="mt-4">
          <p className="text-sm leading-7 text-[#6f6b79]">
            You are building a consistent rhythm. Nutrition and movement are trending
            upward, and mindful spending stayed within your health budget this week.
          </p>
        </Panel>
      </Stagger>
    </>
  );
}
