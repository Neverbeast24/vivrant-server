"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Dumbbell,
  Flame,
  Scale,
  Sparkles,
  Target,
  Utensils,
  WalletCards,
  Weight,
} from "lucide-react";
import { toast } from "sonner";
import { generateWeeklyStory } from "@/app/dashboard/reports/ai-actions";
import { ShareExportMenu } from "@/components/dashboard/share-export-menu";
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
import { reportsDoc } from "@/lib/share-export";

export type ReportsData = {
  checkins: number;
  expensesTotal: number;
  workouts: number;
  meals: number;
  gymSessions: number;
  gymMinutes: number;
  activeGoals: number;
  historyEntries: number;
  weekActivity: [string, number][];
  categoryTotals: { category: string; total: number }[];
  recentActivity: { id: string; title: string; meta: string; right: string }[];
  avgEnergy: number | null;
  totalWorkoutMinutes: number;
  totalCalories: number;
  catchUp: { label: string; detail: string; href: string }[];
};

function buildSummary(data: ReportsData) {
  const parts: string[] = [];
  if (data.checkins === 0) {
    return "No check-ins yet this month. Start with a daily check-in so VIVRΛNT can build your weekly summary.";
  }
  parts.push(`You checked in ${data.checkins} time${data.checkins === 1 ? "" : "s"} this month`);
  if (data.avgEnergy != null) parts.push(`with an average energy of ${data.avgEnergy}/100`);
  if (data.meals > 0) parts.push(`logged ${data.meals} meal${data.meals === 1 ? "" : "s"}`);
  if (data.workouts > 0)
    parts.push(`and moved for ${data.totalWorkoutMinutes} minutes across ${data.workouts} sessions`);
  if (data.gymSessions > 0)
    parts.push(`plus ${data.gymSessions} gym session${data.gymSessions === 1 ? "" : "s"}`);
  if (data.activeGoals > 0) parts.push(`while tracking ${data.activeGoals} active goal${data.activeGoals === 1 ? "" : "s"}`);
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
        highlight="summary."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ShareExportMenu
              compact
              doc={reportsDoc({
                ...data,
                story,
                summary: buildSummary(data),
              })}
            />
            <PrimaryButton disabled={writing} onClick={writeStory} className="rounded-full px-5">
              <Sparkles size={14} className="shrink-0" />
              {writing ? "Writing…" : "AI weekly summary"}
            </PrimaryButton>
          </div>
        }
      />
      <Stagger>
        {story && (
          <Panel
            title={story.title}
            className="mb-4"
            right={<span className="text-xs font-black text-accent">{story.score}/100</span>}
          >
            <p className="text-sm leading-7 text-muted">{story.story}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {story.focuses.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-black text-accent"
                >
                  {focus}
                </span>
              ))}
            </div>
          </Panel>
        )}

        <Panel
          title="Still open today"
          className="mb-4"
          right={
            <Link href="/dashboard" className="text-xs font-black text-accent">
              Today →
            </Link>
          }
        >
          {data.catchUp.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.catchUp.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="rounded-2xl border border-ink/8 bg-surface/60 px-4 py-3 transition hover:border-accent/25"
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>Today’s logs look complete. Nice rhythm.</EmptyState>
          )}
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Check-ins"
            value={String(data.checkins)}
            detail="This month"
            icon={Activity}
            tone="brand"
          />
          <StatCard
            label="Meals logged"
            value={String(data.meals)}
            detail={`${data.totalCalories.toLocaleString()} kcal recorded`}
            icon={Utensils}
            tone="soft"
          />
          <StatCard
            label="Workouts"
            value={String(data.workouts)}
            detail={`${data.totalWorkoutMinutes} active minutes`}
            icon={Dumbbell}
            tone="warn"
          />
          <StatCard
            label="Health spend"
            value={`₱${data.expensesTotal.toLocaleString()}`}
            detail="This month"
            icon={WalletCards}
            tone="surface"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Gym sessions"
            value={String(data.gymSessions)}
            detail={`${data.gymMinutes} gym minutes`}
            icon={Weight}
            tone="soft"
          />
          <StatCard
            label="Active goals"
            value={String(data.activeGoals)}
            detail="From your profile"
            icon={Target}
            tone="surface"
          />
          <StatCard
            label="Body history"
            value={String(data.historyEntries)}
            detail="Measurements this month"
            icon={Scale}
            tone="surface"
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel
            title="Activity this week"
            right={
              <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
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
                    <span className="text-muted">₱{row.total.toLocaleString()}</span>
                  </div>
                  <Progress value={(row.total / maxCategory) * 100} />
                </div>
              ))}
              {!data.categoryTotals.length && <EmptyState>No expenses yet this month.</EmptyState>}
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.5fr]">
          <Panel title="Monthly insight" right={<Flame size={17} className="text-ember" />}>
            <p className="text-sm leading-7 text-muted">{buildSummary(data)}</p>
            <Link
              href="/dashboard/ai"
              className="mt-5 inline-flex items-center gap-1 text-xs font-black text-accent transition hover:gap-2"
            >
              Ask VIVRΛNT <ArrowUpRight size={13} />
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
                <EmptyState>
                  Log meals, workouts, gym sessions, or body history to see activity here.
                </EmptyState>
              )}
            </div>
          </Panel>
        </div>
      </Stagger>
    </>
  );
}
