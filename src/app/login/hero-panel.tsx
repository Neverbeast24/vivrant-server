"use client";

import { motion, type Variants } from "motion/react";
import {
  Activity,
  Apple,
  Droplets,
  Flame,
  HeartPulse,
  Moon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Brand } from "@/components/brand";

const rise: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

function float(duration: number, distance = 10) {
  return {
    y: [0, -distance, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
  };
}

const cardShell =
  "rounded-3xl border border-white/12 bg-white/8 shadow-[0_24px_60px_rgba(10,6,30,.45)] backdrop-blur-xl";

function HeartRateCard() {
  return (
    <motion.div
      custom={0.5}
      variants={rise}
      whileHover={{ scale: 1.04, rotate: -1 }}
      className={`absolute right-8 top-[17%] w-56 p-5 ${cardShell}`}
    >
      <motion.div animate={float(5.5, 8)}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#ff6b8b]/20 text-[#ff8ba5]">
            <HeartPulse size={19} />
          </span>
          <div>
            <p className="text-[11px] font-bold text-white/50">Resting heart</p>
            <p className="text-lg font-black text-white">
              62 <span className="text-xs font-bold text-white/45">bpm</span>
            </p>
          </div>
        </div>
        <svg viewBox="0 0 200 44" className="mt-4 w-full" aria-hidden="true">
          <motion.path
            d="M0 26 H36 L48 26 56 10 66 38 76 20 84 26 H120 L130 26 138 14 148 34 156 26 H200"
            fill="none"
            stroke="#ff8ba5"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, delay: 0.9, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function HydrationCard() {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.72;

  return (
    <motion.div
      custom={0.7}
      variants={rise}
      whileHover={{ scale: 1.05, rotate: 1.5 }}
      className={`absolute bottom-[24%] right-24 w-48 p-5 ${cardShell}`}
    >
      <motion.div animate={float(6.5, 12)} className="flex items-center gap-4">
        <div className="relative grid size-16 shrink-0 place-items-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" />
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#38e0e8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 1.6, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <Droplets size={18} className="text-[#4fe6ed]" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white/50">Hydration</p>
          <p className="text-lg font-black text-white">72%</p>
          <p className="text-[10px] font-semibold text-white/40">5 of 7 glasses</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StreakChip() {
  return (
    <motion.div
      custom={0.9}
      variants={rise}
      whileHover={{ scale: 1.08 }}
      className={`absolute left-10 top-[13%] flex items-center gap-2.5 px-4 py-3 ${cardShell}`}
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame size={17} className="text-[#ffb35c]" />
      </motion.div>
      <p className="text-xs font-black text-white">
        12-day streak <span className="ml-1 font-semibold text-white/45">keep going</span>
      </p>
    </motion.div>
  );
}

function SleepChip() {
  return (
    <motion.div
      custom={1.1}
      variants={rise}
      whileHover={{ scale: 1.08 }}
      className={`absolute bottom-[13%] left-14 flex items-center gap-3 px-4 py-3.5 ${cardShell}`}
    >
      <motion.div animate={float(7, 6)} className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[#8f7bff]/25 text-[#b6a8ff]">
          <Moon size={16} />
        </span>
        <div>
          <p className="text-[10px] font-bold text-white/50">Sleep quality</p>
          <p className="text-sm font-black text-white">
            7h 40m <span className="text-[10px] font-bold text-emerald-300">+6%</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrbitingIcons() {
  const icons = [
    { Icon: Apple, className: "left-[46%] top-[9%] text-emerald-300/80", d: 8 },
    { Icon: Activity, className: "right-[12%] top-[46%] text-[#4fe6ed]/80", d: 9.5 },
    { Icon: TrendingUp, className: "left-[8%] top-[46%] text-[#b6a8ff]/80", d: 7 },
    { Icon: Sparkles, className: "bottom-[34%] left-[38%] text-[#ffb35c]/70", d: 10.5 },
  ];

  return (
    <>
      {icons.map(({ Icon, className, d }, index) => (
        <motion.span
          key={index}
          custom={1.2 + index * 0.15}
          variants={rise}
          className={`absolute grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/6 backdrop-blur-md ${className}`}
        >
          <motion.span animate={float(d, 9)} className="grid place-items-center">
            <Icon size={16} />
          </motion.span>
        </motion.span>
      ))}
    </>
  );
}

export function HeroPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-[#1b1826] p-12 text-white lg:flex lg:flex-col">
      {/* Ambient glow + grid backdrop */}
      <div className="animate-glow absolute -left-32 top-24 size-[30rem] rounded-full bg-[#7557ff]/28 blur-[100px]" />
      <div className="animate-glow-slow absolute -bottom-44 right-0 size-[32rem] rounded-full bg-[#20d8dd]/22 blur-[110px]" />
      <div className="animate-glow-slow absolute left-1/3 top-1/2 size-[22rem] rounded-full bg-[#ff6b8b]/12 blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <Brand tone="dark" className="relative z-10" />

      <motion.div initial="hidden" animate="show" className="absolute inset-0 z-0">
        <HeartRateCard />
        <HydrationCard />
        <StreakChip />
        <SleepChip />
        <OrbitingIcons />
      </motion.div>

      <div className="relative z-10 my-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-6xl leading-[1.02]">
            Your healthier rhythm starts quietly.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/55">
            One private space to notice patterns, celebrate progress, and make
            your next choice with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap gap-2.5"
        >
          {["Nutrition", "Movement", "Sleep", "Groceries", "AI insights"].map((label) => (
            <motion.span
              key={label}
              whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.14)" }}
              className="cursor-default rounded-full border border-white/12 bg-white/6 px-4 py-1.5 text-xs font-bold text-white/75 backdrop-blur-md"
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <p className="relative z-10 text-xs text-white/35">Every choice shapes your health.</p>
    </section>
  );
}
