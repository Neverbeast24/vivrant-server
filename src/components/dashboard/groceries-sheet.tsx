"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownAZ, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import {
  addGroceryItem,
  addGroceryItemsBulk,
  deleteGroceryItem,
  toggleGroceryItem,
  updateGroceryItem,
} from "@/app/dashboard/groceries/actions";
import { ExcelSheetFrame, ExcelTd, ExcelTh, excelAddRow, excelBodyRow, excelCancelBtn, excelCellInput, excelFootRow, excelHeadRow, excelHeaderBtn, excelIndexCell } from "@/components/dashboard/excel-sheet";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { QuickListPaste } from "@/components/dashboard/quick-list-paste";
import { EmptyState, PageHeader, Panel, PrimaryButton, fieldClass } from "@/components/dashboard/ui";
import { GROCERY_CATEGORY_META, GROCERY_CATEGORY_ORDER } from "@/lib/groceries/categories";
import { formatPhp } from "@/lib/groceries/ph-price-catalog";
import { kitchenSubNav } from "@/lib/nav";

export type GrocerySheetItem = {
  id: number;
  name: string;
  quantity: string | null;
  category: string | null;
  is_checked: boolean;
  estimated_price: number | null;
};

type DraftRow = {
  name: string;
  quantity: string;
  category: string;
  estimated_price: string;
};

type SortKey = "name" | "category" | "estimated_price" | "is_checked";

export function GroceriesSheet({
  items,
  embedded = false,
  showPaste = true,
}: {
  items: GrocerySheetItem[];
  embedded?: boolean;
  showPaste?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [newRow, setNewRow] = useState<DraftRow>({
    name: "",
    quantity: "",
    category: "other",
    estimated_price: "",
  });
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = items.filter((row) => {
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.quantity ?? "").toLowerCase().includes(q) ||
        (row.category ?? "").toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "estimated_price") {
        return (Number(a.estimated_price ?? 0) - Number(b.estimated_price ?? 0)) * dir;
      }
      if (sortKey === "is_checked") {
        return (Number(a.is_checked) - Number(b.is_checked)) * dir;
      }
      return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")) * dir;
    });
  }, [items, filter, sortKey, sortAsc]);

  const visibleTotal = rows.reduce((sum, row) => sum + Number(row.estimated_price ?? 0), 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((value) => !value);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function beginEdit(item: GrocerySheetItem) {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      quantity: item.quantity ?? "",
      category: item.category ?? "other",
      estimated_price: item.estimated_price != null ? String(item.estimated_price) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    return new Promise<boolean>((resolve) => {
      start(async () => {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        resolve(result.ok);
      });
    });
  }

  function saveEdit(id: number) {
    if (!draft) return;
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("name", draft.name.trim());
    formData.set("quantity", draft.quantity);
    formData.set("category", draft.category);
    formData.set("estimated_price", draft.estimated_price);
    run(async () => {
      const result = await updateGroceryItem(formData);
      if (result.ok) cancelEdit();
      return result;
    });
  }

  function addRow() {
    if (!newRow.name.trim()) return;
    const formData = new FormData();
    formData.set("name", newRow.name.trim());
    formData.set("quantity", newRow.quantity);
    formData.set("category", newRow.category);
    if (newRow.estimated_price) formData.set("estimated_price", newRow.estimated_price);
    run(async () => {
      const result = await addGroceryItem(formData);
      if (result.ok) {
        setNewRow({ name: "", quantity: "", category: "other", estimated_price: "" });
      }
      return result;
    });
  }

  const table = (
    <Panel
      title="Excel-style shopping list"
      right={
        <span className="hidden text-[10px] font-bold text-muted sm:inline">
          Name is enough · Enter to add · click a row to edit
        </span>
      }
    >
      <div className="mb-4">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by name, qty, or category…"
          className={`${fieldClass} sm:max-w-sm`}
        />
      </div>

      <ExcelSheetFrame minWidthClass="min-w-[760px]">
        <thead>
          <tr className={excelHeadRow}>
            <ExcelTh className="w-10 text-center text-[10px] font-black text-muted">#</ExcelTh>
            <ExcelTh className="w-14">
              <button type="button" onClick={() => toggleSort("is_checked")} className={excelHeaderBtn}>
                Buy
              </button>
            </ExcelTh>
            {(
              [
                ["name", "Item", ""],
                ["category", "Category", "w-[11rem]"],
                ["estimated_price", "Est. ₱", "w-[7rem]"],
              ] as const
            ).map(([key, label, width]) => (
              <ExcelTh key={key} className={width}>
                <button type="button" onClick={() => toggleSort(key)} className={excelHeaderBtn}>
                  {label}
                  <ArrowDownAZ size={11} className={sortKey === key ? "opacity-100" : "opacity-30"} />
                </button>
              </ExcelTh>
            ))}
            <ExcelTh className="w-[9rem]">Qty</ExcelTh>
            <th className="w-[7rem] border-b border-ink/12 px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const isEditing = editingId === item.id && draft;
            return (
              <tr
                key={item.id}
                className={excelBodyRow(index, item.is_checked ? "opacity-60" : "")}
              >
                <ExcelTd className={excelIndexCell}>
                  {index + 1}
                </ExcelTd>
                <ExcelTd className="text-center">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    disabled={pending}
                    onChange={() => run(() => toggleGroceryItem(item.id, !item.is_checked))}
                    aria-label={`Check off ${item.name}`}
                  />
                </ExcelTd>
                {isEditing ? (
                  <>
                    <ExcelTd pad={false}>
                      <input
                        value={draft.name}
                        autoFocus
                        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEdit(item.id);
                          if (event.key === "Escape") cancelEdit();
                        }}
                        className={excelCellInput}
                      />
                    </ExcelTd>
                    <ExcelTd pad={false}>
                      <select
                        value={draft.category}
                        onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                        className={excelCellInput}
                      >
                        {GROCERY_CATEGORY_ORDER.map((key) => (
                          <option key={key} value={key}>
                            {GROCERY_CATEGORY_META[key].label}
                          </option>
                        ))}
                      </select>
                    </ExcelTd>
                    <ExcelTd pad={false}>
                      <input
                        type="number"
                        min={0}
                        value={draft.estimated_price}
                        onChange={(event) =>
                          setDraft({ ...draft, estimated_price: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEdit(item.id);
                          if (event.key === "Escape") cancelEdit();
                        }}
                        className={`${excelCellInput} text-right font-bold`}
                      />
                    </ExcelTd>
                    <ExcelTd pad={false}>
                      <input
                        value={draft.quantity}
                        onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEdit(item.id);
                          if (event.key === "Escape") cancelEdit();
                        }}
                        className={excelCellInput}
                      />
                    </ExcelTd>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => saveEdit(item.id)}
                          className="grid size-7 place-items-center rounded-md bg-accent-soft text-accent"
                          aria-label="Save"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className={excelCancelBtn}
                          aria-label="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <ExcelTd className={`text-sm font-semibold ${item.is_checked ? "line-through" : ""}`}>
                      {item.name}
                    </ExcelTd>
                    <ExcelTd className="text-sm text-muted">
                      {GROCERY_CATEGORY_META[item.category ?? "other"]?.label ?? item.category}
                    </ExcelTd>
                    <ExcelTd className="text-right text-sm font-black tabular-nums">
                      {formatPhp(Number(item.estimated_price ?? 0))}
                    </ExcelTd>
                    <ExcelTd className="text-sm text-muted">{item.quantity ?? "—"}</ExcelTd>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => beginEdit(item)}
                          className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-accent"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={async () => {
                            if (!(await confirmDelete(item.name))) return;
                            run(() => deleteGroceryItem(item.id));
                          }}
                          className="grid size-7 place-items-center rounded-md text-muted hover:bg-ember/15 hover:text-ember"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                No rows yet. Type a name in the bottom row, or paste a list below.
              </td>
            </tr>
          )}
          <tr className={excelAddRow}>
            <td className="border-r border-ink/12 px-2 py-2 text-center text-[10px] font-black text-accent">
              +
            </td>
            <td className="border-r border-ink/12" />
            <ExcelTd pad={false} className="border-ink/12">
              <input
                value={newRow.name}
                onChange={(event) => setNewRow({ ...newRow, name: event.target.value })}
                placeholder="New item…"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addRow();
                }}
                className={excelCellInput}
              />
            </ExcelTd>
            <ExcelTd pad={false} className="border-ink/12">
              <select
                value={newRow.category}
                onChange={(event) => setNewRow({ ...newRow, category: event.target.value })}
                className={excelCellInput}
              >
                {GROCERY_CATEGORY_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {GROCERY_CATEGORY_META[key].label}
                  </option>
                ))}
              </select>
            </ExcelTd>
            <ExcelTd pad={false} className="border-ink/12">
              <input
                type="number"
                min={0}
                value={newRow.estimated_price}
                onChange={(event) => setNewRow({ ...newRow, estimated_price: event.target.value })}
                placeholder="Auto"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addRow();
                }}
                className={`${excelCellInput} text-right font-bold`}
              />
            </ExcelTd>
            <ExcelTd pad={false} className="border-ink/12">
              <input
                value={newRow.quantity}
                onChange={(event) => setNewRow({ ...newRow, quantity: event.target.value })}
                placeholder="qty"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addRow();
                }}
                className={excelCellInput}
              />
            </ExcelTd>
            <td className="px-2 py-1">
              <button
                type="button"
                disabled={pending || !newRow.name.trim()}
                onClick={addRow}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-inverse px-2.5 text-[10px] font-black text-inverse-fg disabled:opacity-50"
              >
                <Plus size={12} />
                Add
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className={excelFootRow}>
            <td
              colSpan={4}
              className="border-t border-ink/12 px-3 py-2 text-right text-xs font-black uppercase tracking-wider text-muted"
            >
              Visible total
            </td>
            <td className="border-t border-r border-ink/12 px-2 py-2 text-right text-sm font-black tabular-nums">
              {formatPhp(visibleTotal)}
            </td>
            <td className="border-t border-ink/12" colSpan={2} />
          </tr>
        </tfoot>
      </ExcelSheetFrame>

      {showPaste && (
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
          Or paste a list
        </p>
        <QuickListPaste
          pending={pending}
          placeholder={"eggs\nmilk, 1L\nrice, 5kg, grains"}
          hint="One name per line. Optional: quantity, category, or ₱ price after a comma or tab."
          onSubmit={(text) => run(() => addGroceryItemsBulk(text))}
        />
      </div>
      )}
    </Panel>
  );

  if (embedded) return table;

  return (
    <>
      <PageHeader
        eyebrow="KITCHEN · SHOPPING"
        title="Sheet"
        highlight="list."
        action={
          <Link href="/dashboard/groceries" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">Back to form</PrimaryButton>
          </Link>
        }
      />
      <ModuleSubNav items={kitchenSubNav} />
      {items.length ? (
        <p className="mb-3 text-xs text-muted">
          {rows.length} row{rows.length === 1 ? "" : "s"} · {formatPhp(visibleTotal)} estimated
        </p>
      ) : (
        <EmptyState>Your list is empty — add a row or paste names below.</EmptyState>
      )}
      {table}
    </>
  );
}
