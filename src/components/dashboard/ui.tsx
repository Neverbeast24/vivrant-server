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
        <p className="text-[11px] font-black tracking-[0.2em] text-[#0e7c66]">{eyebrow}</p>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] sm:text-5xl">
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
  className = "bg-[#f6faf7] text-[#14221b]",
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
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`rounded-[1.4rem] border border-[#14221b]/8 p-5 shadow-[0_14px_32px_rgba(20,34,27,.08)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide opacity-65">{label}</span>
        <span className="grid size-8 place-items-center rounded-xl bg-black/5 opacity-80">
          <Icon size={16} />
        </span>
      </div>
      <p className="font-display mt-7 text-4xl leading-none tracking-tight">
        {value}
        {suffix && (
          <span className="ml-1 align-middle text-xs font-bold opacity-55">{suffix}</span>
        )}
      </p>
      <p className="mt-2.5 text-xs font-semibold opacity-60">{detail}</p>
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
      className={`rounded-[1.4rem] border border-[#14221b]/8 bg-[#f6faf7]/90 p-5 shadow-[0_12px_30px_rgba(20,34,27,.06)] sm:p-6 ${className}`}
    >
      {(title || right) && (
        <div className="mb-6 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl tracking-tight">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-[#14221b]/10 bg-[#e8efe9]/70 px-3.5 py-3 text-sm outline-none transition placeholder:text-[#7a8a81] hover:border-[#14221b]/18 focus:border-[#0e7c66]/45 focus:bg-[#f6faf7] focus:ring-4 focus:ring-[#0e7c66]/10";

export function FormField({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block rounded-2xl border border-[#14221b]/6 bg-white/38 p-2.5 ${className}`}>
      <span className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#5a6b62]">
          {label}
        </span>
        {hint && <span className="text-[10px] font-semibold text-[#7a8a81]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`focus-ring rounded-xl bg-[#14221b] px-4 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(20,34,27,.16)] transition hover:-translate-y-0.5 hover:bg-[#0e7c66] hover:shadow-[0_12px_24px_rgba(14,124,102,.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function ListRow({
  title,
  meta,
  right,
}: {
  title: string;
  meta?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#14221b]/6 bg-[#e8efe9]/45 px-4 py-3 transition hover:border-[#14221b]/12 hover:bg-[#f6faf7]">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{title}</p>
        {meta && <p className="mt-0.5 text-xs capitalize text-[#6a7a71]">{meta}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#14221b]/12 bg-[#e8efe9]/35 px-4 py-8 text-center text-sm text-[#7a8a81]">
      {children}
    </p>
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
                ? "bg-gradient-to-t from-[#0e7c66] to-[#c45c2a]"
                : "bg-[#eae4d6]"
            }`}
          />
          <span className="text-[10px] font-bold text-[#84948b]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({
  value,
  className = "from-[#0e7c66] to-[#c45c2a]",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#14221b]/8">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${className}`}
      />
    </div>
  );
}
