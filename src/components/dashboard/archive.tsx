"use client";

import { useMemo, useState, useTransition } from "react";
import { ArchiveRestore, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadMyBackup, restoreArchivedItem } from "@/app/dashboard/archive/actions";
import {
  BulkBar,
  restoreSelected,
  SelectCheck,
  SelectModeButton,
  useBulkSelect,
} from "@/components/dashboard/bulk-select";
import { confirmAction } from "@/components/dashboard/confirm-dialog";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { SwipeRemove } from "@/components/dashboard/swipe-remove";
import { EmptyState, PageHeader, Panel, PrimaryButton } from "@/components/dashboard/ui";
import { ARCHIVE_LABELS, type ArchiveTable } from "@/lib/archive-catalog";
import { settingsSubNav } from "@/lib/nav";
import { downloadFile } from "@/lib/share-export";

export type ArchiveItem = {
  id: number;
  entity: ArchiveTable;
  entity_id: string;
  title: string;
  deleted_at: string;
};

export function ArchiveView({ items }: { items: ArchiveItem[] }) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [exporting, startExport] = useTransition();
  const [restoring, startRestore] = useTransition();
  const bulk = useBulkSelect(items.map((item) => item.id));
  const grouped = useMemo(() => {
    const map = new Map<ArchiveTable, ArchiveItem[]>();
    for (const item of items) {
      const list = map.get(item.entity) ?? [];
      list.push(item);
      map.set(item.entity, list);
    }
    return [...map.entries()];
  }, [items]);

  async function restore(item: ArchiveItem) {
    const ok = await confirmAction({
      title: `Restore ${item.title}?`,
      body: "It will come back to its original module list.",
      confirmLabel: "Restore",
    });
    if (!ok) return;
    setPendingId(item.id);
    const result = await restoreArchivedItem(item.id);
    setPendingId(null);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  function exportBackup() {
    startExport(async () => {
      const result = await downloadMyBackup();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      downloadFile(
        `vivrant-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(result.dump, null, 2),
        "application/json",
      );
      toast.success("Backup downloaded. Keep this file somewhere safe.");
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="PROFILE"
        title="Archived"
        highlight="items"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 ? (
              <SelectModeButton
                selecting={bulk.selecting}
                onStart={bulk.start}
                onCancel={bulk.clear}
              />
            ) : null}
            <PrimaryButton type="button" disabled={exporting} onClick={exportBackup} className="rounded-full px-4">
              <Download size={14} />
              {exporting ? "Preparing…" : "Download backup"}
            </PrimaryButton>
          </div>
        }
      />
      <ModuleSubNav items={settingsSubNav} />
      <p className="mb-6 text-sm font-semibold text-muted">
        Deleted items stay hidden from every module and from Gemini. Restore them here, or download a
        JSON backup — Supabase’s free plan does not keep point-in-time backups.
      </p>
      {!grouped.length && (
        <EmptyState>Nothing archived yet. When you delete a meal, habit, or plan, it lands here.</EmptyState>
      )}
      <BulkBar
        selecting={bulk.selecting}
        count={bulk.count}
        total={items.length}
        allSelected={bulk.allSelected}
        onSelectAll={bulk.allSelected ? bulk.deselectAll : bulk.selectAll}
        onClear={bulk.clear}
        pending={restoring}
        confirmLabel="Restore"
        onConfirm={() =>
          startRestore(async () => {
            const ok = await restoreSelected(bulk.selectedIds);
            if (ok) bulk.clear();
          })
        }
      />
      <div className="grid gap-5">
        {grouped.map(([entity, rows]) => (
          <Panel
            key={entity}
            title={`${ARCHIVE_LABELS[entity]} · ${rows.length}`}
            right={
              bulk.selecting && rows.length > 1 ? (
                <button
                  type="button"
                  className="text-[11px] font-black text-accent"
                  onClick={() => {
                    const ids = rows.map((row) => row.id);
                    const allOn = ids.every((id) => bulk.selected.has(id));
                    bulk.setMany(ids, !allOn);
                  }}
                >
                  {rows.every((row) => bulk.selected.has(row.id)) ? "Clear group" : "Select group"}
                </button>
              ) : undefined
            }
          >
            <div className="grid gap-2">
              {rows.map((item) => {
                const row = (
                <div
                  role={bulk.selecting ? "checkbox" : undefined}
                  aria-checked={bulk.selecting ? bulk.selected.has(item.id) : undefined}
                  onClick={bulk.selecting ? () => bulk.toggle(item.id) : undefined}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    bulk.selecting && bulk.selected.has(item.id)
                      ? "border-accent/35 bg-accent-soft/50"
                      : "border-ink/6 bg-surface/45"
                  } ${bulk.selecting ? "cursor-pointer" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {bulk.selecting ? <SelectCheck checked={bulk.selected.has(item.id)} /> : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Archived {new Date(item.deleted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {bulk.selecting ? null : (
                    <button
                      type="button"
                      disabled={pendingId === item.id}
                      onClick={() => restore(item)}
                      className="inline-flex items-center gap-1 rounded-full bg-inverse px-3 py-2 text-[11px] font-black text-inverse-fg disabled:opacity-50"
                    >
                      <ArchiveRestore size={13} />
                      Restore
                    </button>
                  )}
                </div>
                );
                if (bulk.selecting) return <div key={item.id}>{row}</div>;
                return (
                  <SwipeRemove
                    key={item.id}
                    label={item.title}
                    action="Restore"
                    onRemove={() => void restore(item)}
                  >
                    {row}
                  </SwipeRemove>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
