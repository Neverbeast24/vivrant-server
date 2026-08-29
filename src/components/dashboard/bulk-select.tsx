"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, CheckSquare2, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { archiveItems, restoreArchivedItems } from "@/app/dashboard/archive/actions";
import { confirmDeleteMany, confirmRestoreMany } from "@/components/dashboard/confirm-dialog";
import { SwipeRemove } from "@/components/dashboard/swipe-remove";
import type { ArchiveTable } from "@/lib/archive-catalog";

export function useBulkSelect(ids: number[]) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const idKey = ids.join(",");

  useEffect(() => {
    const allowed = new Set(
      idKey
        ? idKey
            .split(",")
            .map(Number)
            .filter((n) => Number.isFinite(n) && n > 0)
        : [],
    );
    setSelected((current) => {
      let changed = false;
      const next = new Set<number>();
      for (const id of current) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [idKey]);

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(ids));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function setMany(nextIds: number[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of nextIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
    setSelecting(false);
  }

  return {
    selecting,
    selected,
    selectedIds,
    count: selected.size,
    allSelected,
    toggle,
    selectAll,
    deselectAll,
    setMany,
    clear,
    start: () => setSelecting(true),
    setSelecting,
  };
}

export function SelectCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-md border ${
        checked ? "border-accent bg-accent text-accent-fg" : "border-ink/20 bg-card"
      }`}
      aria-hidden
    >
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  );
}

export function SelectModeButton({
  selecting,
  onStart,
  onCancel,
  disabled,
}: {
  selecting: boolean;
  onStart: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={selecting ? onCancel : onStart}
      className="text-xs font-black text-accent transition hover:opacity-70 disabled:opacity-40"
    >
      {selecting ? "Cancel" : "Select"}
    </button>
  );
}

export function BulkBar({
  selecting,
  count,
  total,
  allSelected,
  onSelectAll,
  onClear,
  onConfirm,
  pending,
  confirmLabel = "Archive",
}: {
  selecting: boolean;
  count: number;
  total: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onConfirm: () => void;
  pending?: boolean;
  confirmLabel?: string;
}) {
  if (!selecting) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/20 bg-accent-soft/45 px-3 py-2">
      <button
        type="button"
        onClick={onSelectAll}
        className="inline-flex items-center gap-1 text-xs font-black text-accent"
      >
        {allSelected ? <CheckSquare2 size={14} /> : <Square size={14} />}
        {allSelected ? "Clear all" : `Select all (${total})`}
      </button>
      <span className="text-xs font-bold text-muted">{count} selected</span>
      <button
        type="button"
        disabled={!count || pending}
        onClick={onConfirm}
        className="ml-auto inline-flex items-center gap-1 rounded-full bg-inverse px-3 py-1.5 text-[11px] font-black text-inverse-fg disabled:opacity-40"
      >
        <Trash2 size={12} />
        {pending ? "Working…" : `${confirmLabel}${count ? ` ${count}` : ""}`}
      </button>
      <button type="button" onClick={onClear} className="grid size-8 place-items-center rounded-full text-muted">
        <X size={14} />
      </button>
    </div>
  );
}

export async function archiveSelected(table: ArchiveTable, ids: number[]) {
  if (!ids.length) return false;
  if (!(await confirmDeleteMany(ids.length))) return false;
  const result = await archiveItems(table, ids);
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
  return result.ok;
}

export async function restoreSelected(ids: number[]) {
  if (!ids.length) return false;
  if (!(await confirmRestoreMany(ids.length))) return false;
  const result = await restoreArchivedItems(ids);
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
  return result.ok;
}

/** Swipe to archive, or tap to toggle when selecting. */
export function SelectableRow({
  id,
  label,
  selecting,
  selected,
  onToggle,
  onArchive,
  children,
}: {
  id: number;
  label: string;
  selecting: boolean;
  selected: boolean;
  onToggle: (id: number) => void;
  onArchive: () => void | Promise<void>;
  children: ReactNode;
}) {
  if (selecting) {
    return (
      <div
        role="checkbox"
        aria-checked={selected}
        aria-label={`Select ${label}`}
        tabIndex={0}
        onClick={() => onToggle(id)}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            onToggle(id);
          }
        }}
        className="cursor-pointer"
      >
        {children}
      </div>
    );
  }
  return (
    <SwipeRemove label={label} action="Archive" onRemove={() => void onArchive()}>
      {children}
    </SwipeRemove>
  );
}
