"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  highlight,
  action,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-black tracking-[0.16em] text-[#7557ff]">{eyebrow}</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          {title}{" "}
          {highlight && <span className="gradient-text italic">{highlight}</span>}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
      className="contents"
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
  className = "bg-white/75 text-[#24212e]",
}: {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`rounded-[1.6rem] border border-white/60 p-5 shadow-[0_16px_35px_rgba(43,36,70,.08)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold opacity-65">{label}</span>
        <Icon size={18} className="opacity-70" />
      </div>
      <p className="mt-8 text-3xl font-black">
        {value}
        {suffix && <span className="ml-1 text-xs opacity-55">{suffix}</span>}
      </p>
      <p className="mt-2 text-xs font-semibold opacity-60">{detail}</p>
    </motion.article>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      className={`rounded-[1.6rem] border border-[#26222f]/6 bg-[#fdfbf4]/80 p-5 shadow-sm sm:p-6 ${className}`}
    >
      {(title || right) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h2 className="text-lg font-black">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function Bars({
  data,
  activeIndex,
}: {
  data: [string, number][];
  activeIndex?: number;
}) {
  return (
    <div className="flex h-40 items-end justify-between gap-3">
      {data.map(([label, height], index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-3">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: 0.15 + index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-10 rounded-full ${
              index === activeIndex
                ? "bg-gradient-to-t from-[#7657ff] to-[#23d4df]"
                : "bg-[#eae4d6]"
            }`}
          />
          <span className="text-[10px] font-bold text-[#a19ca7]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({
  value,
  className = "from-[#8c73ff] to-[#35d8dd]",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/8">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${className}`}
      />
    </div>
  );
}
