"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import type { ActivityItem } from "@/lib/activity-format";
import { settingsSubNav } from "@/lib/nav";

function entityLabel(entity: string) {
  return entity.replace(/_/g, " ");
}

export function ActivityView({ items }: { items: ActivityItem[] }) {
  const entities = useMemo(() => {
    const set = new Set(items.map((item) => item.entity).filter(Boolean));
    return [...set].sort();
  }, [items]);
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? items : items.filter((item) => item.entity === filter);

  return (
    <>
      <PageHeader eyebrow="PROFILE" title="Activity" highlight="history" />
      <ModuleSubNav items={settingsSubNav} />
      <p className="mb-6 text-sm font-semibold text-muted">
        Your change history from audit logs — including gym programs that were updated or removed.
      </p>
      {entities.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
              filter === "all" ? "bg-inverse text-inverse-fg" : "bg-surface text-muted"
            }`}
          >
            All · {items.length}
          </button>
          {entities.map((entity) => (
            <button
              type="button"
              key={entity}
              onClick={() => setFilter(entity)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black capitalize ${
                filter === entity ? "bg-inverse text-inverse-fg" : "bg-surface text-muted"
              }`}
            >
              {entityLabel(entity)} · {items.filter((item) => item.entity === entity).length}
            </button>
          ))}
        </div>
      )}
      {!visible.length ? (
        <EmptyState>No activity yet. Updates to meals, programs, and settings will land here.</EmptyState>
      ) : (
        <Panel title={`${visible.length} event${visible.length === 1 ? "" : "s"}`}>
          <div className="grid gap-2">
            {visible.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-ink/6 bg-surface/45 px-4 py-3"
              >
                <ClipboardList size={16} className="mt-0.5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
