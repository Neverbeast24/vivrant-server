/** Move an item from one index to another, ignoring no-op or out-of-range moves. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list;
  }
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Apply a saved id order, then append any items that were not in the list. */
export function applyIdOrder<T extends { id: number }>(
  items: T[],
  order: number[] | null | undefined,
): T[] {
  if (!order?.length) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<number>();
  const out: T[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  for (const item of items) {
    if (!seen.has(item.id)) out.push(item);
  }
  return out;
}

export const LIST_ORDER_MODULES = [
  "groceries",
  "pantry",
  "habits",
  "goals",
  "reminders",
] as const;

export type ListOrderModule = (typeof LIST_ORDER_MODULES)[number];

export function parseListOrder(raw: unknown): Partial<Record<ListOrderModule, number[]>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<ListOrderModule, number[]>> = {};
  for (const key of LIST_ORDER_MODULES) {
    const value = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(value)) continue;
    out[key] = value
      .map((id) => Math.round(Number(id)))
      .filter((id) => Number.isFinite(id) && id > 0)
      .slice(0, 200);
  }
  return out;
}
