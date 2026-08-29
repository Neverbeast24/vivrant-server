"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownAZ, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import {
  archiveSelected,
  BulkBar,
  SelectCheck,
  SelectModeButton,
  useBulkSelect,
} from "@/components/dashboard/bulk-select";
import {
  addPantryItem,
  addPantryItemsBulk,
  deletePantryItem,
  updatePantryItem,
  updatePantryStock,
} from "@/app/dashboard/pantry/actions";
import {
  PANTRY_CATEGORIES,
  categoryLabel,
  type PantryItem,
} from "@/app/dashboard/pantry/shared";
import { ExcelSheetFrame, ExcelTd, ExcelTh, excelAddRow, excelBodyRow, excelCancelBtn, excelCellInput, excelHeadRow, excelHeaderBtn, excelIndexCell } from "@/components/dashboard/excel-sheet";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { QuickListPaste } from "@/components/dashboard/quick-list-paste";
import { PageHeader, Panel, PrimaryButton, fieldClass } from "@/components/dashboard/ui";
import { kitchenSubNav } from "@/lib/nav";

type DraftRow = {
  name: string;
  category: string;
  stock_level: string;
};

type SortKey = "name" | "category" | "stock_level";

export function PantrySheet({
  items,
  embedded = false,
}: {
  items: PantryItem[];
  embedded?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [newRow, setNewRow] = useState<DraftRow>({
    name: "",
    category: "grains",
    stock_level: "50",
  });
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = items.filter(
      (row) =>
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "stock_level") return (a.stock_level - b.stock_level) * dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
  }, [items, filter, sortKey, sortAsc]);
  const bulk = useBulkSelect(rows.map((row) => row.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((value) => !value);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
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
    formData.set("category", draft.category);
    formData.set("stock_level", draft.stock_level);
    run(async () => {
      const result = await updatePantryItem(formData);
      if (result.ok) {
        setEditingId(null);
        setDraft(null);
      }
      return result;
    });
  }

  function addRow() {
    if (!newRow.name.trim()) return;
    const formData = new FormData();
    formData.set("name", newRow.name.trim());
    formData.set("category", newRow.category);
    formData.set("stock_level", newRow.stock_level || "50");
    run(async () => {
      const result = await addPantryItem(formData);
      if (result.ok) setNewRow({ name: "", category: "grains", stock_level: "50" });
      return result;
    });
  }

  const table = (
    <Panel
      title="Excel-style pantry sheet"
      right={
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] font-bold text-muted sm:inline">
            Name is enough · stock defaults to 50%
          </span>
          {rows.length > 0 ? (
            <SelectModeButton
              selecting={bulk.selecting}
              onStart={bulk.start}
              onCancel={bulk.clear}
            />
          ) : null}
        </div>
      }
    >
      <BulkBar
        selecting={bulk.selecting}
        count={bulk.count}
        total={rows.length}
        allSelected={bulk.allSelected}
        onSelectAll={bulk.allSelected ? bulk.deselectAll : bulk.selectAll}
        onClear={bulk.clear}
        pending={pending}
        onConfirm={() =>
          start(async () => {
            const ok = await archiveSelected("pantry_items", bulk.selectedIds);
            if (ok) bulk.clear();
          })
        }
      />
      <div className="mb-4">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by name or category…"
          className={`${fieldClass} sm:max-w-sm`}
        />
      </div>
      <ExcelSheetFrame minWidthClass="min-w-[640px]">
        <thead>
          <tr className={excelHeadRow}>
            <ExcelTh className="w-10 text-center text-[10px] font-black text-muted">#</ExcelTh>
            {(
              [
                ["name", "Item", ""],
                ["category", "Category", "w-[10rem]"],
                ["stock_level", "Stock %", "w-[7rem]"],
              ] as const
            ).map(([key, label, width]) => (
              <ExcelTh key={key} className={width}>
                <button type="button" onClick={() => toggleSort(key)} className={excelHeaderBtn}>
                  {label}
                  <ArrowDownAZ size={11} className={sortKey === key ? "opacity-100" : "opacity-30"} />
                </button>
              </ExcelTh>
            ))}
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
                className={excelBodyRow(index)}
              >
                <ExcelTd className={excelIndexCell}>
                  {bulk.selecting ? (
                    <button
                      type="button"
                      onClick={() => bulk.toggle(item.id)}
                      aria-label={`Select ${item.name}`}
                      className="mx-auto block"
                    >
                      <SelectCheck checked={bulk.selected.has(item.id)} />
                    </button>
                  ) : (
                    index + 1
                  )}
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
                          if (event.key === "Escape") {
                            setEditingId(null);
                            setDraft(null);
                          }
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
                        {PANTRY_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </ExcelTd>
                    <ExcelTd pad={false}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.stock_level}
                        onChange={(event) =>
                          setDraft({ ...draft, stock_level: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEdit(item.id);
                        }}
                        className={`${excelCellInput} text-right font-bold`}
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
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
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
                    <ExcelTd className="text-sm font-semibold">{item.name}</ExcelTd>
                    <ExcelTd className="text-sm text-muted">{categoryLabel(item.category)}</ExcelTd>
                    <ExcelTd className="text-right text-sm font-black tabular-nums">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            updatePantryStock(item.id, Math.min(100, item.stock_level + 10)),
                          )
                        }
                        className="mr-1 text-[10px] text-muted"
                        aria-label={`Increase ${item.name} stock`}
                      >
                        +
                      </button>
                      {item.stock_level}%
                    </ExcelTd>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setDraft({
                              name: item.name,
                              category: item.category,
                              stock_level: String(item.stock_level),
                            });
                          }}
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
                            run(() => deletePantryItem(item.id));
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
          <tr className={excelAddRow}>
            <td className="border-r border-ink/12 px-2 py-2 text-center text-[10px] font-black text-accent">
              +
            </td>
            <ExcelTd pad={false} className="border-ink/12">
              <input
                value={newRow.name}
                onChange={(event) => setNewRow({ ...newRow, name: event.target.value })}
                placeholder="New pantry item…"
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
                {PANTRY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </ExcelTd>
            <ExcelTd pad={false} className="border-ink/12">
              <input
                type="number"
                min={0}
                max={100}
                value={newRow.stock_level}
                onChange={(event) => setNewRow({ ...newRow, stock_level: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addRow();
                }}
                className={`${excelCellInput} text-right font-bold`}
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
      </ExcelSheetFrame>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
          Or paste a list
        </p>
        <QuickListPaste
          pending={pending}
          placeholder={"brown rice\neggs\nmilk"}
          hint="One name per line. Optional: category or stock % after a comma."
          onSubmit={(text) => run(() => addPantryItemsBulk(text))}
        />
      </div>
    </Panel>
  );

  if (embedded) return table;

  return (
    <>
      <PageHeader
        eyebrow="PANTRY"
        title="Sheet"
        highlight="stock."
        action={
          <Link href="/dashboard/pantry/add" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">Back to form</PrimaryButton>
          </Link>
        }
      />
      <ModuleSubNav items={kitchenSubNav} />
      {table}
    </>
  );
}
