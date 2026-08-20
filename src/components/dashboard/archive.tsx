"use client";

import { useMemo, useState, useTransition } from "react";
import { ArchiveRestore, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadMyBackup, restoreArchivedItem } from "@/app/dashboard/archive/actions";
import { confirmAction } from "@/components/dashboard/confirm-dialog";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { EmptyState, PageHeader, Panel, PrimaryButton } from "@/components/dashboard/ui";
import { ARCHIVE_LABELS, type ArchiveTable } from "@/lib/archive-catalog";
import { settingsSubNav } from "@/lib/nav";

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
      const blob = new Blob([JSON.stringify(result.dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vivrant-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
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
          <PrimaryButton type="button" disabled={exporting} onClick={exportBackup} className="rounded-full px-4">
            <Download size={14} />
            {exporting ? "Preparing…" : "Download backup"}
          </PrimaryButton>
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
      <div className="grid gap-5">
        {grouped.map(([entity, rows]) => (
          <Panel key={entity} title={`${ARCHIVE_LABELS[entity]} · ${rows.length}`}>
            <div className="grid gap-2">
              {rows.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink/6 bg-surface/45 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Archived {new Date(item.deleted_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => restore(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-inverse px-3 py-2 text-[11px] font-black text-inverse-fg disabled:opacity-50"
                  >
                    <ArchiveRestore size={13} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
