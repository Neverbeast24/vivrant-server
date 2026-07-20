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
  ClipboardList,
  Dumbbell,
  FileBarChart,
  Goal,
  HeartPulse,
  History,
  Leaf,
  MessageCircle,
  ReceiptText,
  Refrigerator,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  UserRound,
  Utensils,
  WalletCards,
  Weight,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";

const insights = [
  {
    icon: HeartPulse,
    title: "Vitality score",
    value: "84",
    detail: "+7 this week",
    color: "from-[#0a5c4c] to-[#2a9d8f]",
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
    icon: HeartPulse,
    title: "Today dashboard",
    copy: "Start each day with check-in, live stats, and one clear next step.",
    tag: "Daily",
    iconClass: "bg-gradient-to-br from-[#0a5c4c] to-[#0e7c66]",
  },
  {
    icon: Utensils,
    title: "Nutrition tracker",
    copy: "Log meals and get AI macro estimates in seconds.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#14b8a6] to-[#2dd4bf]",
  },
  {
    icon: Dumbbell,
    title: "Movement",
    copy: "Workouts, steps, and AI suggestions that match your energy.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#fb7185] to-[#f472b6]",
  },
  {
    icon: Weight,
    title: "Gym & machines",
    copy: "Demos, machine picks, session logs, and AI training plans.",
    tag: "Train",
    iconClass: "bg-gradient-to-br from-[#6366f1] to-[#818cf8]",
  },
  {
    icon: ReceiptText,
    title: "Health spending",
    copy: "Track wellness budget and see where money helps or hurts health.",
    tag: "Track",
    iconClass: "bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]",
  },
  {
    icon: Refrigerator,
    title: "Smart pantry",
    copy: "Know what you have and cook with less waste.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#38bdf8] to-[#22d3ee]",
  },
  {
    icon: ShoppingBasket,
    title: "Grocery planner",
    copy: "Healthier lists with budget-aware AI suggestions.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#a3e635] to-[#4ade80]",
  },
  {
    icon: Goal,
    title: "Goals & profile",
    copy: "Turn priorities into targets you can actually follow.",
    tag: "Plan",
    iconClass: "bg-gradient-to-br from-[#2a9d8f] to-[#0e7c66]",
  },
  {
    icon: MessageCircle,
    title: "Ask VIVRΛNT",
    copy: "Chat with your AI coach across nutrition, gym, and spending.",
    tag: "AI",
    iconClass: "bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa]",
  },
  {
    icon: FileBarChart,
    title: "Weekly reports",
    copy: "Story-style summaries of patterns, wins, and what to adjust.",
    tag: "Understand",
    iconClass: "bg-gradient-to-br from-[#ec4899] to-[#f472b6]",
  },
  {
    icon: History,
    title: "Health history",
    copy: "Keep conditions, notes, and context for smarter recommendations.",
    tag: "Understand",
    iconClass: "bg-gradient-to-br from-[#64748b] to-[#94a3b8]",
  },
  {
    icon: Bell,
    title: "Smart reminders",
    copy: "Useful nudges without notification overload.",
    tag: "Understand",
    iconClass: "bg-gradient-to-br from-[#fb923c] to-[#f97316]",
  },
  {
    icon: ClipboardList,
    title: "Admin console",
    copy: "Users, roles, audit logs, and system health for staff.",
    tag: "Foundation",
    iconClass: "bg-gradient-to-br from-[#334155] to-[#475569]",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    copy: "Supabase Auth and row-level protection on every record.",
    tag: "Foundation",
    iconClass: "bg-gradient-to-br from-[#0e7490] to-[#06b6d4]",
  },
  {
    icon: UserRound,
    title: "Profile & settings",
    copy: "Avatars, preferences, and a space that feels truly yours.",
    tag: "Foundation",
    iconClass: "bg-gradient-to-br from-[#1a9b78] to-[#7ec8b8]",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    blurb: "Everything you need to build a healthier daily rhythm.",
    highlight: false,
    features: [
      "Today dashboard & check-ins",
      "Nutrition, movement & spending logs",
      "Pantry & grocery planner",
      "Basic AI insights",
      "Weekly report preview",
    ],
    cta: "Get started free",
  },
  {
    name: "Plus",
    price: "₱299",
    period: "/ month",
    blurb: "Full AI coaching, gym plans, and deeper weekly stories.",
    highlight: true,
    features: [
      "Everything in Starter",
      "Ask VIVRΛNT unlimited chat",
      "Gym demos, machines & AI plans",
      "Full weekly reports & reminders",
      "Health history analysis",
      "Priority AI responses",
    ],
    cta: "Start Plus trial",
  },
  {
    name: "Campus",
    price: "Custom",
    period: "research & teams",
    blurb: "Admin console, member activity, and analytics for programs.",
    highlight: false,
    features: [
      "Everything in Plus",
      "Admin & super-admin roles",
      "Audit logs & member activity",
      "Bulk onboarding support",
      "Research analytics export",
      "Dedicated setup help",
    ],
    cta: "Contact for access",
  },
];

const testimonials = [
  {
    quote: "It finally feels like one app instead of five trackers fighting each other.",
    name: "Maya R.",
    role: "Nutrition focus",
    accent: "from-[#14b8a6] to-[#0e7c66]",
  },
  {
    quote: "The gym module with machine demos is genuinely useful — not just another logbook.",
    name: "Jon K.",
    role: "Strength training",
    accent: "from-[#6366f1] to-[#818cf8]",
  },
  {
    quote: "Weekly reports read like a coach talking to me, not a spreadsheet yelling.",
    name: "Ari S.",
    role: "Budget + wellness",
    accent: "from-[#f59e0b] to-[#fb7185]",
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
  "VIVRΛNT analyzes",
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
  "Today dashboard",
  "Nutrition tracker",
  "Movement & workouts",
  "Gym & machines",
  "Smart pantry",
  "Grocery planner",
  "Health spending",
  "Ask VIVRΛNT",
  "Weekly reports",
  "Health history",
  "Smart reminders",
  "Admin console",
  "Decision engine",
  "Goal setup",
];

const heroStats: [string, string][] = [
  ["15+", "connected modules"],
  ["1", "clear next action daily"],
  ["24/7", "AI watching your rhythm"],
  ["100%", "your data, protected"],
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="animate-glow absolute -left-32 top-20 size-[28rem] rounded-full bg-[#0e7c66]/18 blur-[100px]" />
        <div className="animate-glow-slow absolute -right-24 top-1/3 size-[24rem] rounded-full bg-[#2a9d8f]/16 blur-[90px]" />
        <div className="animate-glow absolute bottom-0 left-1/3 size-[20rem] rounded-full bg-[#c45c2a]/10 blur-[80px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-[#14221b]/6 bg-[#e8efe9]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Brand />
          <div className="hidden items-center gap-7 text-sm font-semibold text-[#696574] lg:flex">
            <a href="#experience" className="transition-colors hover:text-[#0e7c66]">
              Experience
            </a>
            <a href="#modules" className="transition-colors hover:text-[#0e7c66]">
              Modules
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#0e7c66]">
              Pricing
            </a>
            <a href="#principles" className="transition-colors hover:text-[#0e7c66]">
              Why VIVRΛNT
            </a>
          </div>
          <Link
            href="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#14221b] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0e7c66] hover:shadow-md"
          >
            Get started
            <ArrowUpRight size={15} />
          </Link>
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
              src="/vivrant-mark.png"
              alt="VIVRΛNT logo"
              width={72}
              height={72}
              priority
              className="size-[72px] rounded-2xl object-cover shadow-[0_18px_40px_rgba(14,124,102,.22)]"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c45c2a]/20 bg-[#f6faf7]/80 px-3.5 py-2 text-xs font-bold text-[#a84b22] shadow-sm backdrop-blur-xl">
              <Sparkles size={14} />
              Long live life
            </div>
          </div>
          <h1 className="font-display max-w-3xl text-6xl leading-[0.96] font-medium text-[#14221b] sm:text-7xl lg:text-[5.6rem]">
            Make every choice feel{" "}
            <span className="gradient-text italic">healthier.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#55665d]">
            VIVRΛNT turns everyday signals into a clear, personal rhythm for
            nutrition, movement, goals, and mindful spending.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="focus-ring group inline-flex items-center gap-2 rounded-full bg-[#14221b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(20,34,27,.22)] transition hover:-translate-y-1 hover:bg-[#0e7c66]"
            >
              Get started free
              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#777280]">
              <Check size={16} className="text-[#21b5a5]" />
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#0e7c66] underline-offset-2 hover:underline">
                Sign in
              </Link>
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
          <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-[#0e7c66]/20 via-transparent to-[#2a9d8f]/20 blur-3xl" />
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
              className={`absolute z-10 hidden items-center gap-2 rounded-full border border-white/80 bg-[#f6faf7]/95 px-3.5 py-2 text-xs font-black text-[#3d4a42] shadow-[0_14px_34px_rgba(20,34,27,.16)] backdrop-blur-md sm:inline-flex ${chip.className}`}
            >
              <span className="text-base leading-none">{chip.emoji}</span>
              {chip.label}
            </motion.span>
          ))}
          <div className="glass noise overflow-hidden rounded-[2.2rem] p-3">
            <div className="rounded-[1.7rem] border border-[#14221b]/6 bg-[#e8efe9]/90 p-4 sm:p-6">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-2">
                  <i className="size-2.5 rounded-full bg-[#ff6d69]" />
                  <i className="size-2.5 rounded-full bg-[#ffca4c]" />
                  <i className="size-2.5 rounded-full bg-[#34c759]" />
                </div>
                <span className="rounded-full bg-[#f6faf7]/90 px-3 py-1 text-[10px] font-bold tracking-wider text-[#6f8077]">
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
                    className="rounded-[1.4rem] border border-[#14221b]/6 bg-[#f6faf7]/90 p-4 shadow-[0_12px_30px_rgba(20,34,27,.07)]"
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
                <div className="rounded-[1.4rem] bg-[#14221b] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/55">VIVRΛNT INSIGHT</span>
                    <BrainCircuit size={18} className="text-[#9f8aff]" />
                  </div>
                  <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">
                    Your energy is strongest after morning walks. Tomorrow’s
                    plan now protects that rhythm.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[#14221b]/6 bg-gradient-to-br from-[#f6faf7] to-[#eaf6ec] p-5">
                  <WalletCards size={19} className="text-[#16a89c]" />
                  <p className="mt-6 text-xs font-bold text-[#3d4a42]">Health investment</p>
                  <p className="mt-1 text-2xl font-black">₱1,420</p>
                  <p className="mt-1 text-[10px] text-[#8f8a98]">12% smarter this month</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-[1.8rem] border border-[#14221b]/8 bg-[#14221b]/8 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map(([value, label], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.07 }}
              className="bg-[#f6faf7]/85 p-7 text-center"
            >
              <p className="font-display text-4xl tracking-tight text-[#14221b]">{value}</p>
              <p className="mt-2 text-xs font-bold text-[#6f8077]">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#14221b]/8 bg-[#f6faf7]/60 py-5" aria-hidden>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max items-center gap-3">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-[#14221b]/8 bg-[#e8efe9]/80 px-5 py-2 text-xs font-black tracking-wide text-[#5a6b62] shadow-sm"
              >
                <span
                  className={`size-2 rounded-full ${
                    index % 4 === 0
                      ? "bg-[#0e7c66]"
                      : index % 4 === 1
                        ? "bg-[#6366f1]"
                        : index % 4 === 2
                          ? "bg-[#f59e0b]"
                          : "bg-[#ec4899]"
                  }`}
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.5rem] border border-[#0e7c66]/15 bg-gradient-to-r from-[#d7efe6]/80 via-[#f6faf7]/90 to-[#e8f5f0]/80 px-5 py-4 shadow-sm">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0e7c66] opacity-40" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#0e7c66]" />
          </span>
          <p className="text-center text-sm font-semibold text-[#3d4a42]">
            <span className="font-black text-[#0e7c66]">Live now:</span> Gym plans, AI meal estimates, weekly reports, and 15+ modules — all in one rhythm.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-[2rem] bg-[#14221b] p-8 text-white sm:p-10"
          >
            <span className="text-xs font-black tracking-[0.2em] text-[#aa98ff]">
              OUR MISSION
            </span>
            <h2 className="font-display mt-6 max-w-lg text-4xl leading-tight">
              Smarter daily decisions, not another pile of health data.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">
              VIVRΛNT helps people understand what they should do next through
              personalized recommendations shaped by their real routines.
            </p>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-[#14221b]/8 bg-gradient-to-br from-[#e8f5f0] to-[#d7efe6] p-8 sm:p-10"
          >
            <span className="text-xs font-black tracking-[0.2em] text-[#0e7c66]">
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
            <span className="text-xs font-black tracking-[0.2em] text-[#0e7c66]">
              THE VIVRΛNT ECOSYSTEM
            </span>
            <h2 className="font-display mt-4 max-w-2xl text-5xl leading-tight">
              Your whole health picture, finally connected.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#5a6b62]">
            Fifteen focused modules work together so every recommendation sees
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
            className="group relative overflow-hidden rounded-[1.7rem] bg-[#14221b] p-6 text-white sm:col-span-2 sm:row-span-2 sm:p-8"
          >
            <div className="absolute -right-20 -top-24 size-64 rounded-full bg-[#0e7c66]/35 blur-[80px] transition-all duration-700 group-hover:scale-150 group-hover:bg-[#0e7c66]/45" />
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
            className="group relative overflow-hidden rounded-[1.7rem] border border-[#14221b]/8 bg-gradient-to-br from-[#d7efe6] via-[#f6faf7] to-[#e8f5f0] p-6 sm:col-span-2"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#0a5c4c] to-[#2a9d8f] text-white shadow-lg shadow-[#0e7c66]/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Sparkles size={19} />
              </span>
              <span className="rounded-full bg-[#0e7c66]/10 px-3 py-1 text-[10px] font-black tracking-wider text-[#6654cc]">
                DAILY
              </span>
            </div>
            <h3 className="mt-5 text-lg font-black">AI recommendations</h3>
            <p className="mt-2 max-w-md text-xs leading-6 text-[#5a6b62]">
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
              className="group relative overflow-hidden rounded-[1.5rem] border border-[#14221b]/8 bg-[#f6faf7]/80 p-5 shadow-[0_12px_35px_rgba(20,34,27,.05)] backdrop-blur-xl transition-shadow hover:shadow-[0_22px_50px_rgba(20,34,27,.12)]"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-10 place-items-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${module.iconClass}`}
                >
                  <module.icon size={18} />
                </span>
                <span className="rounded-full bg-black/4 px-2.5 py-1 text-[9px] font-black tracking-wider text-[#8a8492] transition-colors group-hover:bg-[#0e7c66]/10 group-hover:text-[#6654cc]">
                  {module.tag.toUpperCase()}
                </span>
              </div>
              <h3 className="mt-6 text-base font-black">{module.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#817c88]">{module.copy}</p>
              <ArrowUpRight
                size={15}
                className="absolute bottom-5 right-5 text-[#0e7c66] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="noise relative overflow-hidden rounded-[2.3rem] bg-[#14221b] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute -right-24 -top-32 size-96 rounded-full bg-[#0e7c66]/30 blur-[100px]" />
          <div className="absolute -bottom-40 left-1/3 size-80 rounded-full bg-[#20d8dd]/15 blur-[100px]" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-[#ad9cff]">
                <BrainCircuit size={16} />
                DECISION ENGINE
              </span>
              <h2 className="font-display mt-6 max-w-2xl text-5xl leading-tight">
                VIVRΛNT turns daily activity into your best next action.
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
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-[#0e7c66]">
              <Zap size={14} /> REAL VOICES
            </span>
            <h2 className="font-display mt-4 text-4xl leading-tight sm:text-5xl">
              People actually use this every day.
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-[#14221b]/8 bg-[#f6faf7]/80 px-4 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className="fill-[#f59e0b] text-[#f59e0b]" />
            ))}
            <span className="ml-2 text-xs font-bold text-[#5a6b62]">Loved by early testers</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative overflow-hidden rounded-[1.7rem] border border-[#14221b]/8 bg-[#f6faf7]/85 p-6 shadow-[0_16px_40px_rgba(20,34,27,.06)]"
            >
              <div className={`absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br ${item.accent} opacity-20 blur-2xl`} />
              <p className="relative text-sm leading-7 text-[#3d4a42]">&ldquo;{item.quote}&rdquo;</p>
              <div className="relative mt-6 flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-full bg-gradient-to-br ${item.accent} text-xs font-black text-white`}>
                  {item.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-black">{item.name}</p>
                  <p className="text-[11px] font-semibold text-[#7b7685]">{item.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-[#0e7c66]">
            <WalletCards size={14} /> SIMPLE PRICING
          </span>
          <h2 className="font-display mt-4 text-5xl leading-tight">
            Start free. Grow when you&apos;re ready.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5a6b62]">
            No credit card for Starter. Plus unlocks the full AI coach. Campus is
            built for research programs and admin teams.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className={`relative flex flex-col overflow-hidden rounded-[2rem] p-7 sm:p-8 ${
                plan.highlight
                  ? "border-2 border-[#0e7c66] bg-[#14221b] text-white shadow-[0_24px_60px_rgba(14,124,102,.28)]"
                  : "border border-[#14221b]/8 bg-[#f6faf7]/90 shadow-[0_16px_40px_rgba(20,34,27,.06)]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-6 top-6 rounded-full bg-[#0e7c66] px-3 py-1 text-[10px] font-black tracking-wider text-white">
                  MOST POPULAR
                </span>
              )}
              <p className={`text-xs font-black tracking-[0.18em] ${plan.highlight ? "text-[#49d6d9]" : "text-[#0e7c66]"}`}>
                {plan.name.toUpperCase()}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-5xl tracking-tight">{plan.price}</span>
                <span className={`mb-2 text-sm font-semibold ${plan.highlight ? "text-white/50" : "text-[#7b7685]"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-6 ${plan.highlight ? "text-white/60" : "text-[#5a6b62]"}`}>
                {plan.blurb}
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-[#49d6d9]" : "text-[#0e7c66]"}`} />
                    <span className={plan.highlight ? "text-white/80" : "text-[#3d4a42]"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-[#14221b] hover:bg-[#d7efe6]"
                    : "bg-[#14221b] text-white hover:bg-[#0e7c66]"
                }`}
              >
                {plan.cta}
                <ArrowUpRight size={15} />
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-black tracking-[0.2em] text-[#0e7c66]">
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
              className="relative rounded-2xl border border-[#14221b]/8 bg-[#f6faf7]/70 p-4 text-center"
            >
              <span className="mx-auto grid size-7 place-items-center rounded-full bg-[#14221b] text-[10px] font-black text-white">
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
        <div className="grid overflow-hidden rounded-[2rem] border border-[#14221b]/8 bg-[#f6faf7]/60 md:grid-cols-3">
          {features.map(([title, copy], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-[#14221b]/8 p-8 last:border-0 md:border-r md:border-b-0"
            >
              <span className="mb-8 block text-xs font-black text-[#856df0]">
                0{index + 1}
              </span>
              <h3 className="font-display text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5a6b62]">{copy}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-xs font-black tracking-[0.2em] text-[#6f8077]">
            COMING NEXT
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {futureFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-[#14221b]/10 bg-[#f6faf7]/80 px-4 py-2 text-xs font-bold text-[#5a6b62]"
              >
                {feature}
              </span>
            ))}
          </div>
          <p className="font-display mx-auto mt-12 max-w-3xl text-4xl leading-tight">
            Every choice shapes your health.{" "}
            <span className="gradient-text italic">VIVRΛNT helps shape the next one.</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="noise relative overflow-hidden rounded-[2.3rem] bg-[#14221b] px-6 py-14 text-center text-white sm:px-10 lg:py-20"
        >
          <div className="animate-glow absolute -left-24 top-0 size-80 rounded-full bg-[#0e7c66]/35 blur-[100px]" />
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
              Set your goals, log your day, and let VIVRΛNT turn the noise into one
              clear next action — every single morning.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="focus-ring group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-[#14221b] shadow-[0_14px_34px_rgba(0,0,0,.3)] transition hover:-translate-y-1 hover:bg-[#d7efe6]"
              >
                Get started free
                <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-[#14221b]/8 bg-[#f6faf7]/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
          <Brand />
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-[#6f8077] md:justify-start">
            <a href="#experience" className="transition-colors hover:text-[#0e7c66]">Experience</a>
            <a href="#modules" className="transition-colors hover:text-[#0e7c66]">Modules</a>
            <a href="#pricing" className="transition-colors hover:text-[#0e7c66]">Pricing</a>
            <a href="#principles" className="transition-colors hover:text-[#0e7c66]">Why VIVRΛNT</a>
            <Link href="/login" className="transition-colors hover:text-[#0e7c66]">Get started</Link>
          </div>
          <p className="text-xs font-semibold text-[#84948b]">
            © {new Date().getFullYear()} VIVRΛNT · Long live life
          </p>
        </div>
      </footer>
    </main>
  );
}
