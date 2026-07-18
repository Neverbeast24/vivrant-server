import type { Metadata } from "next";
import {
  ActivityExplorer,
  type ActivityRecord,
} from "@/components/admin/activity-explorer";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Member Activity" };

export default async function AdminActivityPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [profiles, checkins, meals, workouts, expenses, groceries, pantry, insights] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .order("display_name")
        .limit(500),
      supabase
        .from("daily_checkins")
        .select("id, user_id, energy, mood, steps, water_ml, note, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("nutrition_logs")
        .select("id, user_id, meal_name, meal_type, calories, protein_g, logged_at")
        .order("logged_at", { ascending: false })
        .limit(500),
      supabase
        .from("workout_logs")
        .select("id, user_id, title, activity_type, duration_minutes, calories_burned, logged_at")
        .order("logged_at", { ascending: false })
        .limit(500),
      supabase
        .from("expenses")
        .select("id, user_id, title, category, amount, spent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("grocery_items")
        .select("id, user_id, name, quantity, is_checked, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("pantry_items")
        .select("id, user_id, name, category, stock_level, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("ai_recommendations")
        .select("id, user_id, title, body, score, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  const records: ActivityRecord[] = [
    ...(checkins.data ?? []).map((row) => ({
      id: `checkin-${row.id}`,
      user_id: row.user_id,
      module: "check-in",
      title: `Energy ${row.energy ?? "—"} · Mood ${row.mood ?? "—"}`,
      detail: row.note || `${row.steps ?? 0} steps · ${row.water_ml ?? 0} ml water`,
      value: `${row.steps ?? 0} steps`,
      timestamp: row.created_at,
    })),
    ...(meals.data ?? []).map((row) => ({
      id: `meal-${row.id}`,
      user_id: row.user_id,
      module: "nutrition",
      title: row.meal_name,
      detail: `${row.meal_type} · ${row.protein_g ?? 0}g protein`,
      value: `${row.calories ?? 0} kcal`,
      timestamp: row.logged_at,
    })),
    ...(workouts.data ?? []).map((row) => ({
      id: `workout-${row.id}`,
      user_id: row.user_id,
      module: "movement",
      title: row.title,
      detail: `${row.activity_type} · ${row.calories_burned ?? 0} kcal`,
      value: `${row.duration_minutes ?? 0} min`,
      timestamp: row.logged_at,
    })),
    ...(expenses.data ?? []).map((row) => ({
      id: `expense-${row.id}`,
      user_id: row.user_id,
      module: "spending",
      title: row.title,
      detail: row.category,
      value: `₱${Number(row.amount).toLocaleString()}`,
      timestamp: row.created_at,
    })),
    ...(groceries.data ?? []).map((row) => ({
      id: `grocery-${row.id}`,
      user_id: row.user_id,
      module: "groceries",
      title: row.name,
      detail: row.is_checked ? "Purchased" : "Open grocery item",
      value: row.quantity || "—",
      timestamp: row.created_at,
    })),
    ...(pantry.data ?? []).map((row) => ({
      id: `pantry-${row.id}`,
      user_id: row.user_id,
      module: "pantry",
      title: row.name,
      detail: row.category,
      value: `${row.stock_level}% stock`,
      timestamp: row.created_at,
    })),
    ...(insights.data ?? []).map((row) => ({
      id: `insight-${row.id}`,
      user_id: row.user_id,
      module: "AI",
      title: row.title,
      detail: row.body,
      value: row.score == null ? "—" : `${row.score}/100`,
      timestamp: row.created_at,
    })),
  ].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-[#5f45e6]">
        SUPER ADMIN
      </p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Member activity explorer</h1>
      <p className="mb-8 mt-3 max-w-3xl text-sm leading-6 text-[#77727f]">
        Read-only access to member wellness logs across every module. Filter by member or
        module to support users and investigate data issues.
      </p>
      <ActivityExplorer members={profiles.data ?? []} records={records} />
    </>
  );
}
