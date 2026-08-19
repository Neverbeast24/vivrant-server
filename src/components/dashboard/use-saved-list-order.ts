"use client";

import { useMemo, useState } from "react";
import { saveListOrder } from "@/app/dashboard/settings/list-order-actions";
import { applyIdOrder, moveItem, type ListOrderModule } from "@/lib/reorder";

export function useSavedListOrder<T extends { id: number }>(
  module: ListOrderModule,
  items: T[],
  initialOrder: number[] = [],
) {
  const [order, setOrder] = useState(initialOrder);
  const ordered = useMemo(() => applyIdOrder(items, order), [items, order]);

  function move(from: number, to: number) {
    const next = moveItem(ordered, from, to).map((item) => item.id);
    setOrder(next);
    void saveListOrder(module, next);
  }

  return { items: ordered, move };
}
