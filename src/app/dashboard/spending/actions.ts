"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { archiveRecord } from "@/lib/archive";
import { createClient } from "@/lib/supabase/server";

const expenseSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(["food", "fitness", "supplements", "wellness", "other"]),
  amount: z.coerce.number().min(0),
  spent_at: z.string().date(),
});

const budgetSchema = z.object({
  monthly_health_budget: z.coerce.number().min(0).max(10000000),
});

function revalidateSpending() {
  revalidatePath("/dashboard/spending");
  revalidatePath("/dashboard/spending/log");
  revalidatePath("/dashboard/spending/sheet");
  revalidatePath("/dashboard/spending/budget");
  revalidatePath("/dashboard/settings");
}

export async function addExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    spent_at: formData.get("spent_at"),
  });
  if (!parsed.success) return { ok: false, message: "Please fill in the expense details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    ...parsed.data,
  });
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "expense_added",
    entity: "expenses",
    metadata: { title: parsed.data.title, amount: parsed.data.amount },
  });

  revalidateSpending();
  return { ok: true, message: "Expense added." };
}

export async function addExpensesBulk(text: string, today: string) {
  const { mapTypedLine, parseSpreadsheetPaste } = await import("@/lib/lists/parse-quick-list");
  const categories = ["food", "fitness", "supplements", "wellness", "other"] as const;
  const rows = parseSpreadsheetPaste(text, 40)
    .map((cells) => mapTypedLine(cells, categories))
    .filter((row) => row.name && row.amount != null && row.amount >= 0);
  if (!rows.length) {
    return { ok: false, message: "Paste lines like: Coffee, 120  or  Gym, 500, fitness" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const payload = rows.map((row) => ({
    user_id: user.id,
    title: row.name.slice(0, 120),
    category: categories.includes(row.category as (typeof categories)[number])
      ? row.category
      : "other",
    amount: row.amount,
    spent_at: today,
  }));

  const { error } = await supabase.from("expenses").insert(payload);
  if (error) return { ok: false, message: error.message };

  revalidateSpending();
  return {
    ok: true,
    message: `Added ${payload.length} expense${payload.length === 1 ? "" : "s"}.`,
  };
}

export async function updateExpense(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, message: "Invalid expense." };

  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    spent_at: formData.get("spent_at"),
  });
  if (!parsed.success) return { ok: false, message: "Please fill in the expense details." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "expense_updated",
    entity: "expenses",
    entityId: String(id),
    metadata: { title: parsed.data.title, amount: parsed.data.amount },
  });

  revalidateSpending();
  return { ok: true, message: "Expense updated." };
}

export async function deleteExpense(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const result = await archiveRecord(supabase, {
    table: "expenses",
    id,
    userId: user.id,
    auditAction: "expense_deleted",
  });
  if (!result.ok) return result;

  revalidateSpending();
  return result;
}

export async function saveMonthlyBudget(formData: FormData) {
  const parsed = budgetSchema.safeParse({
    monthly_health_budget: formData.get("monthly_health_budget"),
  });
  if (!parsed.success) return { ok: false, message: "Enter a valid monthly budget." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ monthly_health_budget: parsed.data.monthly_health_budget })
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "monthly_budget_updated",
    entity: "profiles",
    entityId: user.id,
    metadata: { monthly_health_budget: parsed.data.monthly_health_budget },
  });

  revalidateSpending();
  revalidatePath("/dashboard");
  return { ok: true, message: "Monthly budget saved." };
}
