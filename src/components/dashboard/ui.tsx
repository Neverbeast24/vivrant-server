"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

export function IconWell({
  icon: Icon,
  size = 36,
  iconSize = 16,
  className = "",
}: {
  icon: LucideIcon;
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  return (
    <span
      className={`icon-well ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} />
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  highlight,
  lede,
  action,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-[11px] font-black tracking-[0.22em] text-accent">{eyebrow}</p>
        <span className="mt-2.5 block h-[3px] w-9 rounded-full bg-gradient-to-r from-accent-deep via-accent to-cyan" />
        <h1 className="font-display mt-3 text-[2.35rem] leading-[1.05] sm:text-5xl">
          {title}{" "}
          {highlight ? <em className="gradient-text">{highlight}</em> : null}
        </h1>
        {lede ? <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-end">
          {action}
        </div>
      ) : null}
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

export function JumpCard({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.5rem] border border-ink/8 bg-card/92 p-4 shadow-[inset_0_1px_0_var(--glass-inset),0_14px_30px_rgba(var(--shadow-color),.07)] transition hover:-translate-y-0.5 hover:border-accent/28 hover:shadow-[0_20px_40px_rgba(var(--shadow-color),.1)]"
    >
      <span className="hairline" />
      <IconWell icon={icon} size={40} iconSize={17} />
      <p className="mt-3 text-sm font-black">{title}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
    </Link>
  );
}

export function ModuleJumpLinks({
  items,
}: {
  items: readonly { href: string; title: string; icon: LucideIcon; detail?: string }[];
}) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((card) => (
        <JumpCard
          key={card.href}
          href={card.href}
          title={card.title}
          detail={card.detail}
          icon={card.icon}
        />
      ))}
    </div>
  );
}

export type StatTone = "brand" | "surface" | "soft" | "warn" | "ink";

const STAT_TONES: Record<
  StatTone,
  { card: string; label: string; detail: string; icon: string; hairline: boolean }
> = {
  brand: {
    card: "border-transparent bg-gradient-to-br from-accent-deep to-accent text-accent-fg shadow-[0_16px_34px_rgba(14,124,102,.24)]",
    label: "text-accent-fg/80",
    detail: "text-accent-fg/75",
    icon: "bg-accent-fg/18 text-accent-fg shadow-none",
    hairline: false,
  },
  surface: {
    card: "border-ink/10 bg-card/95 text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "",
    hairline: true,
  },
  soft: {
    card: "border-accent/20 bg-surface text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "",
    hairline: true,
  },
  warn: {
    card: "border-accent/30 bg-surface text-ink",
    label: "text-muted",
    detail: "text-muted",
    icon: "",
    hairline: true,
  },
  ink: {
    card: "border-transparent bg-inverse text-inverse-fg shadow-[0_14px_32px_rgba(var(--shadow-color),.14)]",
    label: "text-inverse-fg/75",
    detail: "text-inverse-fg/70",
    icon: "bg-inverse-fg/12 text-inverse-fg shadow-none",
    hairline: false,
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
      className={`relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[inset_0_1px_0_var(--glass-inset),0_14px_32px_rgba(var(--shadow-color),.08)] ${styles.card} ${className}`}
    >
      {styles.hairline ? <span className="hairline" /> : null}
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-bold tracking-wide ${styles.label}`}>{label}</span>
        {styles.icon ? (
          <span className={`grid size-9 shrink-0 place-items-center rounded-[0.85rem] ${styles.icon}`}>
            <Icon size={16} />
          </span>
        ) : (
          <IconWell icon={Icon} size={36} iconSize={16} />
        )}
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
  dense = false,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  dense?: boolean;
}) {
  return (
    <motion.section
      id={id}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      className={`relative overflow-visible rounded-[1.5rem] border border-ink/8 bg-card/92 shadow-[inset_0_1px_0_var(--glass-inset),0_14px_32px_rgba(var(--shadow-color),.06)] ${
        dense ? "p-4 sm:p-4" : "p-4 sm:p-6"
      } ${className}`}
    >
      <span className="hairline" />
      {(title || right) && (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${dense ? "mb-3" : "mb-6"}`}>
          {title ? (
            <h2 className="font-display flex items-center gap-2.5 text-xl tracking-tight">
              <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_70%,transparent)]" />
              {title}
            </h2>
          ) : null}
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export const fieldClass =
  "w-full rounded-2xl border border-ink/10 bg-surface/70 px-3.5 py-3 text-sm outline-none transition placeholder:text-muted hover:border-ink/18 focus:border-accent/45 focus:bg-card focus:ring-4 focus:ring-accent/10";

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
    <label className={`block rounded-2xl border border-ink/7 bg-panel/50 p-2.5 ${className}`}>
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
      className={`focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-inverse px-4 py-3 text-sm font-black text-inverse-fg shadow-[0_8px_18px_rgba(var(--shadow-color),.16)] transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_12px_24px_rgba(14,124,102,.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-ink/10 bg-card px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent-soft hover:text-accent active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function ListRow({
  title,
  meta,
  right,
  left,
  selected = false,
  onSelect,
}: {
  title: string;
  meta?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      role={onSelect ? "checkbox" : undefined}
      aria-checked={onSelect ? selected : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition ${
        selected
          ? "border-accent/35 bg-accent-soft/50"
          : "border-ink/7 bg-surface/50 hover:border-ink/12 hover:bg-card"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {left}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title}</p>
          {meta && <p className="mt-0.5 text-xs capitalize text-muted">{meta}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  title?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-ink/12 bg-surface/40 px-5 py-10 text-center">
      {Icon ? (
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={22} />
        </span>
      ) : null}
      {title ? <p className="mb-1.5 font-display text-lg tracking-tight">{title}</p> : null}
      <p className="text-sm leading-6 text-muted">{children}</p>
    </div>
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
