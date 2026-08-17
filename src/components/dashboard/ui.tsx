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
      <div className="min-w-0">
        <p className="text-[11px] font-black tracking-[0.2em] text-accent">{eyebrow}</p>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] sm:text-5xl">
          {title}{" "}
          {highlight && <span className="gradient-text italic">{highlight}</span>}
        </h1>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-end">{action}</div> : null}
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

export type StatTone = "brand" | "surface" | "soft" | "warn" | "ink";

const STAT_TONES: Record<
  StatTone,
  { card: string; label: string; detail: string; icon: string }
> = {
  brand: {
    card: "border-transparent bg-gradient-to-br from-accent-deep to-accent text-white shadow-[0_16px_34px_rgba(14,124,102,.24)]",
    label: "text-white/80",
    detail: "text-white/75",
    icon: "bg-white/18 text-white",
  },
  surface: {
    card: "border-ink/12 bg-card text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "bg-surface-soft text-accent",
  },
  soft: {
    card: "border-accent/25 bg-surface text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "bg-accent/15 text-accent",
  },
  warn: {
    card: "border-accent/30 bg-surface text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "bg-accent/20 text-accent",
  },
  ink: {
    card: "border-transparent bg-inverse text-inverse-fg shadow-[0_14px_32px_rgba(var(--shadow-color),.14)]",
    label: "text-inverse-fg/75",
    detail: "text-inverse-fg/70",
    icon: "bg-inverse-fg/12 text-inverse-fg",
  },
};

export function StatCard({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
  tone = "surface",
  className = "",
}: {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  const styles = STAT_TONES[tone];
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`rounded-[1.4rem] border p-5 shadow-[0_14px_32px_rgba(var(--shadow-color),.08)] ${styles.card} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-bold tracking-wide ${styles.label}`}>{label}</span>
        <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="font-display mt-7 text-4xl leading-none tracking-tight text-current">
        {value}
        {suffix && (
          <span className={`ml-1 align-middle text-xs font-bold ${styles.detail}`}>{suffix}</span>
        )}
      </p>
      <p className={`mt-2.5 text-xs font-semibold leading-5 ${styles.detail}`}>{detail}</p>
    </motion.article>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
  id,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      className={`rounded-[1.4rem] border border-ink/8 bg-card/90 p-5 shadow-[0_12px_30px_rgba(var(--shadow-color),.06)] sm:p-6 ${className}`}
    >
      {(title || right) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl tracking-tight">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm outline-none transition placeholder:text-muted hover:border-ink/18 focus:border-accent/45 focus:bg-card focus:ring-4 focus:ring-accent/10";

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
    <label className={`block rounded-2xl border border-ink/6 bg-panel/38 p-2.5 ${className}`}>
      <span className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
        {hint && <span className="text-[10px] font-semibold text-muted">{hint}</span>}
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
      className={`focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-inverse px-4 py-3 text-sm font-black text-inverse-fg shadow-[0_8px_18px_rgba(var(--shadow-color),.16)] transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_12px_24px_rgba(14,124,102,.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/6 bg-surface/45 px-4 py-3 transition hover:border-ink/12 hover:bg-card">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{title}</p>
        {meta && <p className="mt-0.5 text-xs capitalize text-muted">{meta}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-ink/12 bg-surface/35 px-4 py-8 text-center text-sm text-muted">
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
                ? "bg-gradient-to-t from-accent to-ember"
                : "bg-warm"
            }`}
          />
          <span className="text-[10px] font-bold text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({
  value,
  className = "from-accent to-ember",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ink/8">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${className}`}
      />
    </div>
  );
}
