"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteGymSession } from "@/app/dashboard/gym/actions";
import {
  archiveSelected,
  BulkBar,
  SelectableRow,
  SelectCheck,
  SelectModeButton,
  useBulkSelect,
} from "@/components/dashboard/bulk-select";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import { EmptyState, ListRow, Panel } from "@/components/dashboard/ui";
import type { GymSession } from "@/lib/gym";

export function GymRecentSessions({ sessions }: { sessions: GymSession[] }) {
  const bulk = useBulkSelect(sessions.map((session) => session.id));
  const [pending, start] = useTransition();

  return (
    <Panel
      title="Recent gym sessions"
      className="mt-4"
      right={
        sessions.length > 0 ? (
          <SelectModeButton selecting={bulk.selecting} onStart={bulk.start} onCancel={bulk.clear} />
        ) : undefined
      }
    >
      <BulkBar
        selecting={bulk.selecting}
        count={bulk.count}
        total={sessions.length}
        allSelected={bulk.allSelected}
        onSelectAll={bulk.allSelected ? bulk.deselectAll : bulk.selectAll}
        onClear={bulk.clear}
        pending={pending}
        onConfirm={() =>
          start(async () => {
            const ok = await archiveSelected("gym_sessions", bulk.selectedIds);
            if (ok) bulk.clear();
          })
        }
      />
      <div className="space-y-2">
        {sessions.map((session) => (
          <SelectableRow
            key={session.id}
            id={session.id}
            label={session.title}
            selecting={bulk.selecting}
            selected={bulk.selected.has(session.id)}
            onToggle={bulk.toggle}
            onArchive={async () => {
              if (!(await confirmDelete(session.title))) return;
              start(async () => {
                const result = await deleteGymSession(session.id);
                if (result.ok) toast.success(result.message);
                else toast.error(result.message);
              });
            }}
          >
            <ListRow
              title={session.title}
              meta={`${session.focus}${session.duration_minutes ? ` · ${session.duration_minutes} min` : ""} · ${new Date(session.logged_at).toLocaleDateString()}`}
              selected={bulk.selecting && bulk.selected.has(session.id)}
              left={bulk.selecting ? <SelectCheck checked={bulk.selected.has(session.id)} /> : undefined}
              right={
                bulk.selecting ? (
                  <span className="text-xs font-black">{session.calories_burned ?? 0} kcal</span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        if (!(await confirmDelete(session.title))) return;
                        const result = await deleteGymSession(session.id);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      })
                    }
                    className="text-[11px] font-black text-muted hover:text-ember"
                  >
                    Archive
                  </button>
                )
              }
            />
          </SelectableRow>
        ))}
        {!sessions.length && <EmptyState>No gym sessions yet. Log today’s program to start a history.</EmptyState>}
      </div>
    </Panel>
  );
}
