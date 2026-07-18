"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Dumbbell,
  Flame,
  Sparkles,
  Utensils,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { generateWeeklyStory } from "@/app/dashboard/reports/ai-actions";
import {
  Bars,
  EmptyState,
  ListRow,
  PageHeader,
  Panel,
  PrimaryButton,
  Progress,
  Stagger,
  StatCard,
} from "@/components/dashboard/ui";

export type ReportsData = {
  checkins: number;
  expensesTotal: number;
  workouts: number;
  meals: number;
  weekActivity: [string, number][];
  categoryTotals: { category: string; total: number }[];
  recentActivity: { id: string; title: string; meta: string; right: string }[];
  avgEnergy: number | null;
  totalWorkoutMinutes: number;
  totalCalories: number;
};

function buildSummary(data: ReportsData) {
  const parts: string[] = [];
  if (data.checkins === 0) {
    return "No check-ins yet this month. Start with a daily check-in so VIVA can build your weekly story.";
  }
  parts.push(`You checked in ${data.checkins} time${data.checkins === 1 ? "" : "s"} this month`);
  if (data.avgEnergy != null) parts.push(`with an average energy of ${data.avgEnergy}/100`);
  if (data.meals > 0) parts.push(`logged ${data.meals} meal${data.meals === 1 ? "" : "s"}`);
  if (data.workouts > 0)
    parts.push(`and moved for ${data.totalWorkoutMinutes} minutes across ${data.workouts} sessions`);
  return parts.join(", ") + ". Keep the rhythm gentle and consistent.";
}

export function ReportsView({ data }: { data: ReportsData }) {
  const maxCategory = Math.max(1, ...data.categoryTotals.map((row) => row.total));
  const [writing, startWrite] = useTransition();
  const [story, setStory] = useState<{
    title: string;
    story: string;
    focuses: string[];
    score: number;
  } | null>(null);

  function writeStory() {
    startWrite(async () => {
      const result = await generateWeeklyStory();
      if (!result.ok || !("story" in result) || !result.story) {
        toast.error(result.message);
        return;
      }
      setStory(result.story);
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="REPORTS"
        title="Your weekly"
        highlight="story."
        action={
          <PrimaryButton disabled={writing} onClick={writeStory} className="rounded-full px-5">
            <Sparkles size={14} className="mr-1.5" />
            {writing ? "Writing…" : "AI weekly story"}
          </PrimaryButton>
        }
      />
      <Stagger>
        {story && (
          <Panel
            title={story.title}
            className="mb-4"
            right={<span className="text-xs font-black text-[#5f45e6]">{story.score}/100</span>}
          >
            <p className="text-sm leading-7 text-[#6f6b79]">{story.story}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {story.focuses.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full bg-[#ece7fb] px-3 py-1 text-[11px] font-black text-[#5f45e6]"
                >
                  {focus}
                </span>
              ))}
            </div>
          </Panel>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Check-ins"
            value={String(data.checkins)}
            detail="This month"
            icon={Activity}
            className="bg-gradient-to-br from-[#5f45e6] to-[#9a57e9] text-white"
          />
          <StatCard
            label="Meals logged"
            value={String(data.meals)}
            detail={`${data.totalCalories.toLocaleString()} kcal recorded`}
            icon={Utensils}
            className="bg-[#e8fbf8] text-[#183d3a]"
          />
          <StatCard
            label="Workouts"
            value={String(data.workouts)}
            detail={`${data.totalWorkoutMinutes} active minutes`}
            icon={Dumbbell}
            className="bg-[#fff3e8] text-[#533621]"
          />
          <StatCard
            label="Health spend"
            value={`₱${data.expensesTotal.toLocaleString()}`}
            detail="This month"
            icon={WalletCards}
            className="bg-[#fdeaf1] text-[#5a2438]"
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel
            title="Activity this week"
            right={
              <span className="rounded-full bg-[#f3f0ff] px-3 py-1.5 text-xs font-bold text-[#6f55df]">
                Check-ins + logs
              </span>
            }
          >
            <Bars
              data={data.weekActivity}
              activeIndex={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
            />
          </Panel>

          <Panel title="Spending by category">
            <div className="space-y-4">
              {data.categoryTotals.map((row) => (
                <div key={row.category}>
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span className="capitalize">{row.category}</span>
                    <span className="text-[#847f8c]">₱{row.total.toLocaleString()}</span>
                  </div>
                  <Progress value={(row.total / maxCategory) * 100} />
                </div>
              ))}
              {!data.categoryTotals.length && <EmptyState>No expenses yet this month.</EmptyState>}
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.5fr]">
          <Panel title="Monthly insight" right={<Flame size={17} className="text-[#e4571f]" />}>
            <p className="text-sm leading-7 text-[#6f6b79]">{buildSummary(data)}</p>
            <Link
              href="/dashboard/ai"
              className="mt-5 inline-flex items-center gap-1 text-xs font-black text-[#5f45e6] transition hover:gap-2"
            >
              Ask VIVA <ArrowUpRight size={13} />
            </Link>
          </Panel>

          <Panel title="Recent activity">
            <div className="space-y-2">
              {data.recentActivity.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.title}
                  meta={item.meta}
                  right={<span className="text-xs font-black">{item.right}</span>}
                />
              ))}
              {!data.recentActivity.length && (
                <EmptyState>Log meals, workouts, or expenses to see activity here.</EmptyState>
              )}
            </div>
          </Panel>
        </div>
      </Stagger>
    </>
  );
}
