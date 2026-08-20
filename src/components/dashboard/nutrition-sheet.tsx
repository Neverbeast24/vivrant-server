"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownAZ, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { confirmDelete } from "@/components/dashboard/confirm-dialog";
import { deleteMeal, logMeal, logMealsBulk, updateMeal } from "@/app/dashboard/nutrition/actions";
import { ExcelSheetFrame, ExcelTd, ExcelTh, excelAddRow, excelBodyRow, excelCancelBtn, excelCellInput, excelFootRow, excelHeadRow, excelHeaderBtn, excelIndexCell } from "@/components/dashboard/excel-sheet";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { QuickListPaste } from "@/components/dashboard/quick-list-paste";
import { PageHeader, Panel, PrimaryButton, fieldClass } from "@/components/dashboard/ui";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

const nutritionSubNav = [
  { href: "/dashboard/nutrition", label: "Overview" },
  { href: "/dashboard/nutrition/log", label: "Log meal" },
  { href: "/dashboard/nutrition/sheet", label: "Sheet" },
] as const;

type Meal = {
  id: number;
  meal_name: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

type DraftRow = {
  meal_name: string;
  meal_type: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
};

type SortKey = "meal_name" | "meal_type" | "calories";

export function NutritionSheet({
  meals,
  embedded = false,
}: {
  meals: Meal[];
  embedded?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("meal_type");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [newRow, setNewRow] = useState<DraftRow>({
    meal_name: "",
    meal_type: "lunch",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = meals.filter(
      (row) =>
        !q ||
        row.meal_name.toLowerCase().includes(q) ||
        row.meal_type.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "calories") return (Number(a.calories ?? 0) - Number(b.calories ?? 0)) * dir;
      return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")) * dir;
    });
  }, [meals, filter, sortKey, sortAsc]);

  const calorieTotal = rows.reduce((sum, row) => sum + Number(row.calories ?? 0), 0);

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

  function toForm(row: DraftRow, id?: number) {
    const formData = new FormData();
    if (id) formData.set("id", String(id));
    formData.set("meal_name", row.meal_name.trim());
    formData.set("meal_type", row.meal_type);
    if (row.calories) formData.set("calories", row.calories);
    if (row.protein_g) formData.set("protein_g", row.protein_g);
    if (row.carbs_g) formData.set("carbs_g", row.carbs_g);
    if (row.fat_g) formData.set("fat_g", row.fat_g);
    return formData;
  }

  function addRow() {
    if (!newRow.meal_name.trim()) return;
    run(async () => {
      const result = await logMeal(toForm(newRow));
      if (result.ok) {
        setNewRow({
          meal_name: "",
          meal_type: "lunch",
          calories: "",
          protein_g: "",
          carbs_g: "",
          fat_g: "",
        });
      }
      return result;
    });
  }

  const table = (
    <Panel
      title="Excel-style meal sheet"
      right={
        <span className="hidden text-[10px] font-bold text-muted sm:inline">
          Name is enough · macros optional
        </span>
      }
    >
      <div className="mb-4">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter meals…"
          className={`${fieldClass} sm:max-w-sm`}
        />
      </div>
      <ExcelSheetFrame minWidthClass="min-w-[780px]">
        <thead>
          <tr className={excelHeadRow}>
            <ExcelTh className="w-10 text-center text-[10px] font-black text-muted">#</ExcelTh>
            {(
              [
                ["meal_name", "Meal", ""],
                ["meal_type", "Type", "w-[8rem]"],
                ["calories", "kcal", "w-[6rem]"],
              ] as const
            ).map(([key, label, width]) => (
              <ExcelTh key={key} className={width}>
                <button
                  type="button"
                  onClick={() => {
                    if (sortKey === key) setSortAsc((value) => !value);
                    else {
                      setSortKey(key);
                      setSortAsc(true);
                    }
                  }}
                  className={excelHeaderBtn}
                >
                  {label}
                  <ArrowDownAZ size={11} className={sortKey === key ? "opacity-100" : "opacity-30"} />
                </button>
              </ExcelTh>
            ))}
            <ExcelTh className="w-[5.5rem]">P</ExcelTh>
            <ExcelTh className="w-[5.5rem]">C</ExcelTh>
            <ExcelTh className="w-[5.5rem]">F</ExcelTh>
            <th className="w-[7rem] border-b border-ink/12 px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((meal, index) => {
            const isEditing = editingId === meal.id && draft;
            return (
              <tr
                key={meal.id}
                className={excelBodyRow(index)}
              >
                <ExcelTd className={excelIndexCell}>
                  {index + 1}
                </ExcelTd>
                {isEditing ? (
                  <>
                    <ExcelTd pad={false}>
                      <input
                        value={draft.meal_name}
                        autoFocus
                        onChange={(event) => setDraft({ ...draft, meal_name: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") run(() => updateMeal(toForm(draft, meal.id)));
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
                        value={draft.meal_type}
                        onChange={(event) => setDraft({ ...draft, meal_type: event.target.value })}
                        className={excelCellInput}
                      >
                        {MEAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </ExcelTd>
                    {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
                      <ExcelTd key={key} pad={false}>
                        <input
                          type="number"
                          min={0}
                          value={draft[key]}
                          onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                          className={`${excelCellInput} text-right`}
                        />
                      </ExcelTd>
                    ))}
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(async () => {
                              const result = await updateMeal(toForm(draft, meal.id));
                              if (result.ok) {
                                setEditingId(null);
                                setDraft(null);
                              }
                              return result;
                            })
                          }
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
                    <ExcelTd className="text-sm font-semibold">{meal.meal_name}</ExcelTd>
                    <ExcelTd className="text-sm capitalize text-muted">{meal.meal_type}</ExcelTd>
                    <ExcelTd className="text-right text-sm font-black tabular-nums">
                      {meal.calories ?? "—"}
                    </ExcelTd>
                    <ExcelTd className="text-right text-sm tabular-nums text-muted">
                      {meal.protein_g ?? "—"}
                    </ExcelTd>
                    <ExcelTd className="text-right text-sm tabular-nums text-muted">
                      {meal.carbs_g ?? "—"}
                    </ExcelTd>
                    <ExcelTd className="text-right text-sm tabular-nums text-muted">
                      {meal.fat_g ?? "—"}
                    </ExcelTd>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(meal.id);
                            setDraft({
                              meal_name: meal.meal_name,
                              meal_type: meal.meal_type,
                              calories: meal.calories != null ? String(meal.calories) : "",
                              protein_g: meal.protein_g != null ? String(meal.protein_g) : "",
                              carbs_g: meal.carbs_g != null ? String(meal.carbs_g) : "",
                              fat_g: meal.fat_g != null ? String(meal.fat_g) : "",
                            });
                          }}
                          className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-accent"
                          aria-label={`Edit ${meal.meal_name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={async () => {
                            if (!(await confirmDelete(meal.meal_name))) return;
                            run(() => deleteMeal(meal.id));
                          }}
                          className="grid size-7 place-items-center rounded-md text-muted hover:bg-ember/15 hover:text-ember"
                          aria-label={`Delete ${meal.meal_name}`}
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
                value={newRow.meal_name}
                onChange={(event) => setNewRow({ ...newRow, meal_name: event.target.value })}
                placeholder="What did you eat?"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addRow();
                }}
                className={excelCellInput}
              />
            </ExcelTd>
            <ExcelTd pad={false} className="border-ink/12">
              <select
                value={newRow.meal_type}
                onChange={(event) => setNewRow({ ...newRow, meal_type: event.target.value })}
                className={excelCellInput}
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </ExcelTd>
            {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
              <ExcelTd key={key} pad={false} className="border-ink/12">
                <input
                  type="number"
                  min={0}
                  value={newRow[key]}
                  placeholder="—"
                  onChange={(event) => setNewRow({ ...newRow, [key]: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addRow();
                  }}
                  className={`${excelCellInput} text-right`}
                />
              </ExcelTd>
            ))}
            <td className="px-2 py-1">
              <button
                type="button"
                disabled={pending || !newRow.meal_name.trim()}
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
              colSpan={3}
              className="border-t border-ink/12 px-3 py-2 text-right text-xs font-black uppercase tracking-wider text-muted"
            >
              Visible kcal
            </td>
            <td className="border-t border-r border-ink/12 px-2 py-2 text-right text-sm font-black tabular-nums">
              {calorieTotal}
            </td>
            <td className="border-t border-ink/12" colSpan={4} />
          </tr>
        </tfoot>
      </ExcelSheetFrame>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">
          Or paste meals
        </p>
        <QuickListPaste
          pending={pending}
          placeholder={"sinigang, lunch, 450\neggs & toast, breakfast, 350"}
          hint="One meal per line. Optional type and calories after a comma."
          submitLabel="Log all"
          onSubmit={(text) => run(() => logMealsBulk(text))}
        />
      </div>
    </Panel>
  );

  if (embedded) return table;

  return (
    <>
      <PageHeader
        eyebrow="NUTRITION"
        title="Sheet"
        highlight="log."
        action={
          <Link href="/dashboard/nutrition/log" className="inline-flex">
            <PrimaryButton className="rounded-full px-5">Back to form</PrimaryButton>
          </Link>
        }
      />
      <ModuleSubNav items={nutritionSubNav} />
      {table}
    </>
  );
}
