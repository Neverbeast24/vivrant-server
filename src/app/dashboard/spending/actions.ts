"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const expenseSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(["food", "fitness", "supplements", "wellness", "other"]),
  amount: z.coerce.number().min(0),
  spent_at: z.string().date(),
});

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

  revalidatePath("/dashboard/spending");
  return { ok: true, message: "Expense added." };
}

export async function deleteExpense(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/spending");
  return { ok: true, message: "Expense removed." };
}
