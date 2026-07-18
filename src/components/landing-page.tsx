"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Check,
  Dumbbell,
  Goal,
  HeartPulse,
  Leaf,
  ReceiptText,
  Refrigerator,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  UserRound,
  Utensils,
  WalletCards,
} from "lucide-react";
import { Brand } from "@/components/brand";

const insights = [
  {
    icon: HeartPulse,
    title: "Vitality score",
    value: "84",
    detail: "+7 this week",
    color: "from-[#5f45e6] to-[#b947ee]",
  },
  {
    icon: Leaf,
    title: "Nutrition",
    value: "92%",
    detail: "On target",
    color: "from-[#14b8a6] to-[#28d8cb]",
  },
  {
    icon: Activity,
    title: "Movement",
    value: "6.4k",
    detail: "1,800 to goal",
    color: "from-[#ff9966] to-[#ff5e8a]",
  },
];

const features = [
  ["One calm view", "Health, habits, groceries, and spending — together."],
  ["Useful intelligence", "Recommendations grounded in your daily patterns."],
  ["Private by design", "Secure access and row-level data protection."],
];

type Module = {
  icon: typeof Activity;
  title: string;
  copy: string;
  tag: string;
  iconClass: string;
};

const modules: Module[] = [
  {
    icon: Utensils,
    title: "Nutrition tracker",
    copy: "Understand meals beyond simple calories.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#14b8a6] to-[#2dd4bf]",
  },
  {
    icon: Dumbbell,
    title: "Workout tracker",
    copy: "Build movement around your energy and goals.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#fb7185] to-[#f472b6]",
  },
  {
    icon: ReceiptText,
    title: "Health expenses",
    copy: "Connect spending decisions with wellbeing.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]",
  },
  {
    icon: Refrigerator,
    title: "Smart pantry",
    copy: "Use what you have and reduce food waste.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#38bdf8] to-[#22d3ee]",
  },
  {
    icon: ShoppingBasket,
    title: "Grocery planner",
    copy: "Create healthier, budget-aware lists.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#a3e635] to-[#4ade80]",
  },
  {
    icon: Goal,
    title: "Goal setup",
    copy: "Turn wellbeing priorities into clear targets.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#818cf8] to-[#6366f1]",
  },
  {
    icon: Activity,
    title: "Health dashboard",
    copy: "See daily signals in one calm workspace.",
    tag: "Understand",
    iconClass: "bg-gradient-to-br from-[#5f45e6] to-[#9b42ff]",
  },
  {
    icon: Bell,
    title: "Smart reminders",
    copy: "Get useful prompts without notification noise.",
    tag: "Understand",
    iconClass: "bg-gradient-to-br from-[#fb923c] to-[#f97316]",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    copy: "Row-level protection around every record.",
    tag: "Foundation",
    iconClass: "bg-gradient-to-br from-[#64748b] to-[#94a3b8]",
  },
  {
    icon: UserRound,
    title: "Profile & settings",
    copy: "Keep VIVA personal, private, and adaptable.",
    tag: "Foundation",
    iconClass: "bg-gradient-to-br from-[#c084fc] to-[#e879f9]",
  },
];

const scores = [
  "Decision Score",
  "Goal Alignment",
  "Health Investment",
  "Lifestyle Consistency",
  "Wellness Balance",
];

const journey = [
  "Create profile",
  "Set goals",
  "Set budget",
  "Log daily choices",
  "VIVA analyzes",
  "Receive next action",
  "Review weekly insights",
];

const futureFeatures = [
  "Wearable integrations",
  "OCR receipt scanning",
  "Barcode scanner",
  "AI meal recognition",
  "Google Fit & Apple Health",
  "Community challenges",
  "Family accounts",
];

const heroChips = [
  { emoji: "🥑", label: "Protein on track", className: "-left-4 top-24 lg:-left-10" },
  { emoji: "🏃", label: "6.4k steps", className: "right-2 top-8 lg:-right-6" },
  { emoji: "💧", label: "1.8L water", className: "-bottom-5 left-16" },
  { emoji: "🧾", label: "₱240 saved", className: "-bottom-3 right-10" },
];

const marqueeItems = [
  "Nutrition tracker",
  "Workout tracker",
  "Smart pantry",
  "Grocery planner",
  "Health expenses",
  "AI recommendations",
  "Goal setup",
  "Weekly reports",
  "Smart reminders",
  "Decision engine",
];

const heroStats: [string, string][] = [
  ["10+", "connected modules"],
  ["1", "clear next action daily"],
  ["24/7", "AI watching your rhythm"],
  ["100%", "your data, protected"],
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="sticky top-0 z-50 border-b border-[#26222f]/6 bg-[#f4efe4]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Brand />
          <div className="hidden items-center gap-8 text-sm font-semibold text-[#696574] md:flex">
            <a href="#experience" className="transition-colors hover:text-[#5f45e6]">
              Experience
            </a>
            <a href="#modules" className="transition-colors hover:text-[#5f45e6]">
              Modules
            </a>
            <a href="#principles" className="transition-colors hover:text-[#5f45e6]">
              Why VIVA
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="focus-ring rounded-full border border-[#26222f]/12 bg-[#fdfbf4]/80 px-5 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-[#26222f] hover:shadow-md"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring hidden rounded-full bg-[#26222f] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5f45e6] sm:inline-flex"
            >
              Open VIVA
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-16 md:px-8 lg:grid-cols-[1.03fr_.97fr] lg:pt-24">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-7 flex flex-wrap items-center gap-3">
            <Image
              src="/viva-logo.png"
              alt="VIVA logo"
              width={72}
              height={72}
              priority
              className="rounded-2xl shadow-[0_18px_40px_rgba(88,70,190,.18)]"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4571f]/20 bg-[#fdfbf4]/80 px-3.5 py-2 text-xs font-bold text-[#c14a1a] shadow-sm backdrop-blur-xl">
              <Sparkles size={14} />
              Long live life
            </div>
          </div>
          <h1 className="font-display max-w-3xl text-6xl leading-[0.96] font-medium text-[#26222f] sm:text-7xl lg:text-[5.6rem]">
            Make every choice feel{" "}
            <span className="gradient-text italic">healthier.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#6f6b79]">
            VIVA turns everyday signals into a clear, personal rhythm for
            nutrition, movement, goals, and mindful spending.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="focus-ring group inline-flex items-center gap-2 rounded-full bg-[#26222f] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(38,34,47,.22)] transition hover:-translate-y-1 hover:bg-[#5f45e6]"
            >
              Explore your space
              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#777280]">
              <Check size={16} className="text-[#21b5a5]" />
              Built for a gentler routine
            </span>
          </div>
        </motion.div>

        <motion.div
          id="experience"
          initial={false}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-[#5f45e6]/20 via-transparent to-[#20d8dd]/20 blur-3xl" />
          {heroChips.map((chip, index) => (
            <motion.span
              key={chip.label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { delay: 0.5 + index * 0.15 },
                scale: { delay: 0.5 + index * 0.15, type: "spring", stiffness: 260 },
                y: { duration: 4 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 },
              }}
              className={`absolute z-10 hidden items-center gap-2 rounded-full border border-white/80 bg-[#fdfbf4]/95 px-3.5 py-2 text-xs font-black text-[#4c4856] shadow-[0_14px_34px_rgba(64,49,38,.16)] backdrop-blur-md sm:inline-flex ${chip.className}`}
            >
              <span className="text-base leading-none">{chip.emoji}</span>
              {chip.label}
            </motion.span>
          ))}
          <div className="glass noise overflow-hidden rounded-[2.2rem] p-3">
            <div className="rounded-[1.7rem] border border-[#26222f]/6 bg-[#f4efe4]/90 p-4 sm:p-6">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-2">
                  <i className="size-2.5 rounded-full bg-[#ff6d69]" />
                  <i className="size-2.5 rounded-full bg-[#ffca4c]" />
                  <i className="size-2.5 rounded-full bg-[#34c759]" />
                </div>
                <span className="rounded-full bg-[#fdfbf4]/90 px-3 py-1 text-[10px] font-bold tracking-wider text-[#8a8478]">
                  FRIDAY · 17 JUL
                </span>
              </div>
              <div className="mb-5">
                <p className="text-sm font-semibold text-[#7b7685]">Good morning</p>
                <h2 className="font-display mt-1 text-4xl">Your day feels balanced.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {insights.map((item) => (
                  <motion.article
                    key={item.title}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="rounded-[1.4rem] border border-[#26222f]/6 bg-[#fdfbf4]/90 p-4 shadow-[0_12px_30px_rgba(64,49,38,.07)]"
                  >
                    <span
                      className={`mb-7 grid size-9 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md`}
                    >
                      <item.icon size={17} />
                    </span>
                    <strong className="block text-2xl">{item.value}</strong>
                    <span className="mt-1 block text-xs font-bold text-[#4a4654]">
                      {item.title}
                    </span>
                    <span className="mt-2 block text-[10px] text-[#96919e]">
                      {item.detail}
                    </span>
                  </motion.article>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[1.4rem] bg-[#26222f] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/55">VIVA INSIGHT</span>
                    <BrainCircuit size={18} className="text-[#9f8aff]" />
                  </div>
                  <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">
                    Your energy is strongest after morning walks. Tomorrow’s
                    plan now protects that rhythm.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[#26222f]/6 bg-gradient-to-br from-[#fdfbf4] to-[#eaf6ec] p-5">
                  <WalletCards size={19} className="text-[#16a89c]" />
                  <p className="mt-6 text-xs font-bold text-[#4c4856]">Health investment</p>
                  <p className="mt-1 text-2xl font-black">₱1,420</p>
                  <p className="mt-1 text-[10px] text-[#8f8a98]">12% smarter this month</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-[1.8rem] border border-[#26222f]/8 bg-[#26222f]/8 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map(([value, label], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.07 }}
              className="bg-[#fdfbf4]/85 p-7 text-center"
            >
              <p className="font-display text-4xl tracking-tight text-[#26222f]">{value}</p>
              <p className="mt-2 text-xs font-bold text-[#8a8491]">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#26222f]/8 bg-[#fdfbf4]/60 py-5" aria-hidden>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max items-center gap-3">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-[#26222f]/8 bg-[#f4efe4]/80 px-5 py-2 text-xs font-black tracking-wide text-[#6b665c]"
              >
                <span className="size-1.5 rounded-full bg-[#5f45e6]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-[2rem] bg-[#26222f] p-8 text-white sm:p-10"
          >
            <span className="text-xs font-black tracking-[0.2em] text-[#aa98ff]">
              OUR MISSION
            </span>
            <h2 className="font-display mt-6 max-w-lg text-4xl leading-tight">
              Smarter daily decisions, not another pile of health data.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">
              VIVA helps people understand what they should do next through
              personalized recommendations shaped by their real routines.
            </p>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-[#26222f]/8 bg-gradient-to-br from-[#fbf3e2] to-[#efeaff] p-8 sm:p-10"
          >
            <span className="text-xs font-black tracking-[0.2em] text-[#6f55df]">
              OUR VISION
            </span>
            <h2 className="font-display mt-6 max-w-lg text-4xl leading-tight">
              An intelligent companion for healthier everyday choices.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#706b78]">
              Nutrition, workouts, budgeting, pantry planning, and AI guidance
              become one connected experience built around your health goals.
            </p>
          </motion.article>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-black tracking-[0.2em] text-[#5f45e6]">
              THE VIVA ECOSYSTEM
            </span>
            <h2 className="font-display mt-4 max-w-2xl text-5xl leading-tight">
              Your whole health picture, finally connected.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#77727f]">
            Twelve focused modules work together so every recommendation sees
            the context behind your choices.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured: decision engine */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-[1.7rem] bg-[#26222f] p-6 text-white sm:col-span-2 sm:row-span-2 sm:p-8"
          >
            <div className="absolute -right-20 -top-24 size-64 rounded-full bg-[#5f45e6]/35 blur-[80px] transition-all duration-700 group-hover:scale-150 group-hover:bg-[#5f45e6]/45" />
            <div className="absolute -bottom-24 -left-16 size-56 rounded-full bg-[#20d8dd]/20 blur-[80px]" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-[#b6a8ff]">
                <BrainCircuit size={13} /> THE BRAIN
              </span>
              <h3 className="font-display mt-6 max-w-sm text-3xl leading-tight sm:text-4xl">
                Decision engine
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/55">
                Every module below feeds this engine. It weighs your goals,
                meals, movement, spending, and pantry to suggest the one action
                worth taking next — not another chart to read.
              </p>
              <div className="mt-8 space-y-2.5">
                {[
                  ["Morning walk logged", "Energy trend protected"],
                  ["Groceries under budget", "₱240 moved to savings"],
                  ["Protein below target", "Tonight: add one easy swap"],
                ].map(([signal, action], index) => (
                  <motion.div
                    key={signal}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + index * 0.12 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/10"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[#49d6d9]" />
                    <span className="flex-1 text-xs font-semibold text-white/70">{signal}</span>
                    <ArrowUpRight size={13} className="shrink-0 text-white/30" />
                    <span className="text-xs font-black text-[#b6a8ff]">{action}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.article>

          {/* Featured: AI recommendations */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: 0.08 }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-[1.7rem] border border-[#26222f]/8 bg-gradient-to-br from-[#efeaff] via-[#fdfbf4] to-[#fbf3e2] p-6 sm:col-span-2"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#5f45e6] to-[#b947ee] text-white shadow-lg shadow-[#5f45e6]/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Sparkles size={19} />
              </span>
              <span className="rounded-full bg-[#5f45e6]/10 px-3 py-1 text-[10px] font-black tracking-wider text-[#6654cc]">
                DAILY
              </span>
            </div>
            <h3 className="mt-5 text-lg font-black">AI recommendations</h3>
            <p className="mt-2 max-w-md text-xs leading-6 text-[#77727f]">
              Context-aware guidance written for your actual day — never a
              generic tip. It knows Tuesday you is different from Sunday you.
            </p>
          </motion.article>

          {modules.map((module, index) => (
            <motion.article
              key={module.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: (index % 4) * 0.06 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-[1.5rem] border border-[#26222f]/8 bg-[#fdfbf4]/80 p-5 shadow-[0_12px_35px_rgba(64,49,38,.05)] backdrop-blur-xl transition-shadow hover:shadow-[0_22px_50px_rgba(64,49,38,.12)]"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-10 place-items-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${module.iconClass}`}
                >
                  <module.icon size={18} />
                </span>
                <span className="rounded-full bg-black/4 px-2.5 py-1 text-[9px] font-black tracking-wider text-[#8a8492] transition-colors group-hover:bg-[#5f45e6]/10 group-hover:text-[#6654cc]">
                  {module.tag.toUpperCase()}
                </span>
              </div>
              <h3 className="mt-6 text-base font-black">{module.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#817c88]">{module.copy}</p>
              <ArrowUpRight
                size={15}
                className="absolute bottom-5 right-5 text-[#5f45e6] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="noise relative overflow-hidden rounded-[2.3rem] bg-[#26222f] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute -right-24 -top-32 size-96 rounded-full bg-[#5f45e6]/30 blur-[100px]" />
          <div className="absolute -bottom-40 left-1/3 size-80 rounded-full bg-[#20d8dd]/15 blur-[100px]" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-[#ad9cff]">
                <BrainCircuit size={16} />
                DECISION ENGINE
              </span>
              <h2 className="font-display mt-6 max-w-2xl text-5xl leading-tight">
                VIVA turns daily activity into your best next action.
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">
                The engine evaluates goals, nutrition, workouts, spending,
                pantry inventory, hydration, and activity consistency before
                generating a personal recommendation.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scores.map((score, index) => (
                <motion.div
                  key={score}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                  className={`rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-xl ${
                    index === scores.length - 1 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/65">{score}</span>
                    <span className="text-xs font-black text-[#49d6d9]">
                      {84 + (index % 3) * 4}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${84 + (index % 3) * 4}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.15 + index * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#8c73ff] to-[#35d8dd]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-black tracking-[0.2em] text-[#5f45e6]">
            HOW IT FLOWS
          </span>
          <h2 className="font-display mt-4 text-5xl">From signals to insight.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {journey.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="relative rounded-2xl border border-[#26222f]/8 bg-[#fdfbf4]/70 p-4 text-center"
            >
              <span className="mx-auto grid size-7 place-items-center rounded-full bg-[#26222f] text-[10px] font-black text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-xs font-bold leading-5">{step}</p>
              {index < journey.length - 1 && (
                <ArrowUpRight className="absolute -right-2 top-1/2 z-10 hidden size-4 rotate-45 text-[#a7a1ad] md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#26222f]/8 bg-[#fdfbf4]/60 md:grid-cols-3">
          {features.map(([title, copy], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-[#26222f]/8 p-8 last:border-0 md:border-r md:border-b-0"
            >
              <span className="mb-8 block text-xs font-black text-[#856df0]">
                0{index + 1}
              </span>
              <h3 className="font-display text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#77727f]">{copy}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-xs font-black tracking-[0.2em] text-[#8a8491]">
            COMING NEXT
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {futureFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-[#26222f]/10 bg-[#fdfbf4]/80 px-4 py-2 text-xs font-bold text-[#6b665c]"
              >
                {feature}
              </span>
            ))}
          </div>
          <p className="font-display mx-auto mt-12 max-w-3xl text-4xl leading-tight">
            Every choice shapes your health.{" "}
            <span className="gradient-text italic">VIVA helps shape the next one.</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="noise relative overflow-hidden rounded-[2.3rem] bg-[#26222f] px-6 py-14 text-center text-white sm:px-10 lg:py-20"
        >
          <div className="animate-glow absolute -left-24 top-0 size-80 rounded-full bg-[#5f45e6]/35 blur-[100px]" />
          <div className="animate-glow-slow absolute -bottom-32 -right-16 size-80 rounded-full bg-[#20d8dd]/25 blur-[100px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black tracking-[0.16em] text-[#b6a8ff]">
              <Sparkles size={14} /> START TODAY
            </span>
            <h2 className="font-display mx-auto mt-7 max-w-2xl text-5xl leading-tight sm:text-6xl">
              Your healthier rhythm is{" "}
              <span className="gradient-text italic">one sign-in away.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/55">
              Set your goals, log your day, and let VIVA turn the noise into one
              clear next action — every single morning.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="focus-ring group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-[#26222f] shadow-[0_14px_34px_rgba(0,0,0,.3)] transition hover:-translate-y-1 hover:bg-[#efeaff]"
              >
                Open your space
                <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/login"
                className="focus-ring rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white/85 transition hover:border-white/50 hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-[#26222f]/8 bg-[#fdfbf4]/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
          <Brand />
          <div className="flex items-center gap-7 text-xs font-bold text-[#8a8491]">
            <a href="#experience" className="transition-colors hover:text-[#5f45e6]">Experience</a>
            <a href="#modules" className="transition-colors hover:text-[#5f45e6]">Modules</a>
            <a href="#principles" className="transition-colors hover:text-[#5f45e6]">Why VIVA</a>
            <Link href="/login" className="transition-colors hover:text-[#5f45e6]">Sign in</Link>
          </div>
          <p className="text-xs font-semibold text-[#a19ca7]">
            © {new Date().getFullYear()} VIVA · Long live life
          </p>
        </div>
      </footer>
    </main>
  );
}
