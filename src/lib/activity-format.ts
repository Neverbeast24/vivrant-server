/** Same row shape as a Supabase `audit_logs` export (audit_logs_rows.json). */
export type AuditLogRow = {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
};

export type ActivityItem = AuditLogRow & {
  title: string;
  detail: string;
};

export function parseAuditMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { raw: value };
    }
  }
  return {};
}

function humanAction(action: string) {
  const cleaned = action.replace(/_/g, " ").trim();
  if (!cleaned) return "Activity";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatActivityItem(row: AuditLogRow): ActivityItem {
  const metadata = parseAuditMetadata(row.metadata);
  const metaTitle =
    typeof metadata.title === "string" && metadata.title.trim()
      ? metadata.title.trim()
      : "";
  const days =
    typeof metadata.days === "number"
      ? metadata.days
      : typeof metadata.days === "string" && Number.isFinite(Number(metadata.days))
        ? Number(metadata.days)
        : null;

  const title =
    metaTitle ||
    (typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : humanAction(row.action));

  const bits = [humanAction(row.action)];
  if (days != null) bits.push(`${days} day${days === 1 ? "" : "s"}`);
  if (row.entity_id) bits.push(`#${row.entity_id}`);
  if (typeof metadata.focus === "string" && metadata.focus.trim()) {
    bits.push(metadata.focus.replace(/_/g, " "));
  }

  return {
    ...row,
    metadata,
    title,
    detail: bits.join(" · "),
  };
}

export function formatActivityItems(rows: AuditLogRow[]): ActivityItem[] {
  return rows.map(formatActivityItem);
}
