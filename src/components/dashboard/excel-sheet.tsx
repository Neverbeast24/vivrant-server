"use client";

/** Shared Excel-sheet chrome — uses theme tokens so light/dark both work. */

export const excelCellInput =
  "h-9 w-full border-0 bg-transparent px-2 text-sm text-ink outline-none scheme-light placeholder:text-muted focus:bg-accent-soft/80 focus:ring-2 focus:ring-inset focus:ring-accent/25 dark:scheme-dark";

export const excelHeaderBtn =
  "inline-flex items-center gap-1 font-black uppercase tracking-[0.08em] text-[10px] text-muted";

export const excelHeadRow = "bg-accent-soft";

export const excelAddRow = "bg-accent-soft/70";

export const excelFootRow = "bg-surface-soft";

export const excelCancelBtn =
  "grid size-7 place-items-center rounded-md bg-surface text-muted transition hover:text-ink";

export const excelIndexCell = "text-center text-[11px] font-bold text-muted";

export const excelGrid = "border-ink/12";

export function excelBodyRow(index: number, extra = "") {
  return `group border-b border-ink/10 ${
    index % 2 === 0 ? "bg-panel" : "bg-card"
  } hover:bg-warm ${extra}`.trim();
}

export function ExcelSheetFrame({
  children,
  minWidthClass = "min-w-[720px]",
}: {
  children: React.ReactNode;
  minWidthClass?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/12 bg-panel shadow-[inset_0_1px_0_var(--glass-inset)]">
      <table className={`${minWidthClass} w-full border-collapse text-left text-ink`}>{children}</table>
    </div>
  );
}

export function ExcelTh({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`border-b border-r border-ink/12 px-2 py-2 ${className}`}>{children}</th>
  );
}

export function ExcelTd({
  children,
  className = "",
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <td className={`border-r border-ink/10 ${pad ? "px-2 py-2" : "p-0"} ${className}`}>
      {children}
    </td>
  );
}
