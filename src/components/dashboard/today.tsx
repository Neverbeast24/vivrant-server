"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ChevronRight,
  Dumbbell,
  Leaf,
  ListChecks,
  Moon,
  Sparkles,
  Target,
  Utensils,
  WalletCards,
  Waves,
} from "lucide-react";
import { QuickCheckin } from "@/components/dashboard/quick-checkin";
import { Bars, PageHeader, Panel, Progress, Stagger, StatCard } from "@/components/dashboard/ui";

export type TodayData = {
  energy: number | null;
  steps: number | null;
  waterMl: number | null;
  sleepMinutes: number | null;
  mood: number | null;
  spendToday: number;
  mealsToday: number;
  workoutsToday: number;
  weekEnergy: [string, number][];
  hasCheckin: boolean;
  stepGoal: number;
  waterGoalMl: number;
  healthFocus: string | null;
  latestInsight: {
    title: string;
    body: string;
    score: number | null;
  } | null;
};

function formatSleep(minutes: number | null) {
  if (minutes == null || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function sleepQuality(minutes: number | null) {
  if (minutes == null) return { value: 0, label: "Log a check-in to track rest" };
  if (minutes >= 420) return { value: 90, label: "Rest quality · Strong" };
  if (minutes >= 360) return { value: 74, label: "Rest quality · Fair" };
  return { value: 48, label: "Rest quality · Needs care" };
}

export function TodayView({ data }: { data: TodayData }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const energy = data.energy ?? 0;
  const steps = data.steps ?? 0;
  const stepGoal = data.stepGoal;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const sleep = sleepQuality(data.sleepMinutes);
  const activeIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const rhythm = [
    {
      icon: Leaf,
      label: data.hasCheckin ? "Morning check-in saved" : "Morning check-in",
      time: "Today",
      done: data.hasCheckin,
      href: "/dashboard",
    },
    {
      icon: Utensils,
      label: data.mealsToday > 0 ? `${data.mealsToday} meal${data.mealsToday === 1 ? "" : "s"} logged` : "Log a meal",
      time: "Nutrition",
      done: data.mealsToday > 0,
      href: "/dashboard/nutrition",
    },
    {
      icon: Target,
      label: (data.waterMl ?? 0) >= 1500 ? "Hydration on track" : "Drink more water",
      time: `${(((data.waterMl ?? 0) / 1000) || 0).toFixed(1)}L`,
      done: (data.waterMl ?? 0) >= data.waterGoalMl,
      href: "/dashboard",
    },
    {
      icon: Dumbbell,
      label: data.workoutsToday > 0 ? "Movement logged" : "Move for 20 minutes",
      time: "Movement",
      done: data.workoutsToday > 0,
      href: "/dashboard/movement",
    },
  ] as const;

  const suggestion =
    data.latestInsight?.body ??
    (energy > 0 && energy < 55
      ? "Your energy looks low. A short walk and a protein snack can help reset the afternoon."
      : steps < stepGoal * 0.5
        ? "You’re under halfway to your step goal. A brisk 15-minute walk would help."
        : data.mealsToday === 0
          ? "No meals logged yet. Capture breakfast or lunch so VIVA can spot patterns."
          : data.healthFocus === "sleep"
            ? "Protect a consistent bedtime tonight; your sleep focus benefits most from regular timing."
            : "A protein-rich snack now may keep your afternoon energy steady.");

  const suggestionTitle = data.latestInsight?.title ?? "VIVA suggests";

  return (
    <>
      <PageHeader
        eyebrow={today.toUpperCase()}
        title="A good day to feel"
        highlight="alive."
        action={<QuickCheckin />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-4">
          <Stagger>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Energy"
                value={data.energy != null ? String(data.energy) : "—"}
                suffix={data.energy != null ? "/100" : undefined}
                detail={data.hasCheckin ? "From today’s check-in" : "Check in to start"}
                icon={Activity}
                className="bg-gradient-to-br from-[#5f45e6] to-[#9a57e9] text-white"
              />
              <StatCard
                label="Daily steps"
                value={steps.toLocaleString()}
                detail={`${stepPct}% of ${stepGoal.toLocaleString()} goal`}
                icon={Waves}
                className="bg-[#e8fbf8] text-[#183d3a]"
              />
              <StatCard
                label="Mindful spend"
                value={`₱${data.spendToday.toLocaleString()}`}
                detail={data.spendToday === 0 ? "No spend logged today" : "Logged today"}
                icon={WalletCards}
                className="bg-[#fff3e8] text-[#533621]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[1.35fr_.65fr]">
              <Panel
                title="Energy this week"
                right={
                  <span className="rounded-full bg-[#f3f0ff] px-3 py-1.5 text-xs font-bold text-[#6f55df]">
                    {data.hasCheckin ? "Live" : "Sample-ready"}
                  </span>
                }
              >
                <Bars data={data.weekEnergy} activeIndex={activeIndex} />
              </Panel>

              <motion.article
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="relative overflow-hidden rounded-[1.6rem] bg-[#20202a] p-6 text-white"
              >
                <div className="absolute -right-10 -top-10 size-36 rounded-full bg-[#5f45e6]/40 blur-3xl" />
                <div className="relative">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                    <Moon size={19} className="text-[#c3b7ff]" />
                  </span>
                  <p className="mt-8 text-xs font-bold text-white/45">SLEEP WINDOW</p>
                  <p className="mt-2 text-3xl font-black">{formatSleep(data.sleepMinutes)}</p>
                  <div className="mt-5">
                    <Progress value={sleep.value} />
                  </div>
                  <p className="mt-3 text-xs text-white/45">{sleep.label}</p>
                </div>
              </motion.article>
            </div>
          </Stagger>
        </div>

        <div className="space-y-4">
          <Stagger>
            <Panel
              title="Today’s rhythm"
              right={<ListChecks size={18} className="text-[#807a88]" />}
            >
              <div className="space-y-5">
                {rhythm.map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        item.done ? "bg-[#e6faf6] text-[#12a595]" : "bg-[#f2eff8] text-[#7c718a]"
                      }`}
                    >
                      <item.icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${item.done ? "text-[#8d8894] line-through" : ""}`}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#a09ba7]">{item.time}</p>
                    </div>
                    <span
                      className={`size-4 rounded-full border-2 ${
                        item.done ? "border-[#26bea9] bg-[#26bea9]" : "border-[#d8d3df]"
                      }`}
                    />
                  </Link>
                ))}
              </div>
            </Panel>

            <motion.article
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.015 }}
              className="rounded-[1.6rem] bg-gradient-to-br from-[#ddf8f3] via-[#eefaf6] to-[#f7f2ff] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-[#fdfbf4] text-[#5f45e6] shadow-sm">
                  <Sparkles size={18} />
                </span>
                <span className="text-[10px] font-black tracking-wider text-[#8a7e98]">
                  {data.latestInsight ? "LATEST INSIGHT" : "VIVA SUGGESTS"}
                </span>
              </div>
              <p className="mt-5 text-sm font-black text-[#332f3c]">{suggestionTitle}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#5f5867]">{suggestion}</p>
              {data.latestInsight?.score != null && (
                <p className="mt-3 text-[11px] font-bold text-[#8a8491]">
                  Decision score {data.latestInsight.score}/100
                </p>
              )}
              <Link
                href="/dashboard/ai"
                className="mt-5 flex w-fit items-center gap-1 text-xs font-black text-[#5f45e6] transition hover:gap-2"
              >
                Ask VIVA <ChevronRight size={13} />
              </Link>
            </motion.article>
          </Stagger>
        </div>
      </div>
    </>
  );
}
