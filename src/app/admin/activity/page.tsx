import type { Metadata } from "next";
import {
  ActivityExplorer,
  type ActivityRecord,
} from "@/components/admin/activity-explorer";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Member Activity" };

const LIMIT = 800;

export default async function AdminActivityPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [
    profiles,
    checkins,
    meals,
    workouts,
    expenses,
    groceries,
    pantry,
    insights,
    gymSessions,
    gymPlans,
    history,
    goals,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, email, avatar_url, role, status")
      .order("display_name")
      .limit(500),
    supabase
      .from("daily_checkins")
      .select("id, user_id, energy, mood, steps, water_ml, note, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("nutrition_logs")
      .select("id, user_id, meal_name, meal_type, calories, protein_g, logged_at")
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("workout_logs")
      .select("id, user_id, title, activity_type, duration_minutes, calories_burned, logged_at")
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("expenses")
      .select("id, user_id, title, category, amount, spent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("grocery_items")
      .select("id, user_id, name, quantity, category, is_checked, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("pantry_items")
      .select("id, user_id, name, category, stock_level, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("ai_recommendations")
      .select("id, user_id, title, body, score, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("gym_sessions")
      .select("id, user_id, title, focus, duration_minutes, calories_burned, logged_at")
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("gym_plans")
      .select("id, user_id, title, focus, level, days_per_week, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("health_history")
      .select("id, user_id, recorded_at, weight_kg, height_cm, body_fat_pct, waist_cm, note, source, created_at")
      .order("recorded_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("health_goals")
      .select("id, user_id, title, category, target_value, current_value, unit, status, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
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
      detail: `${row.category ?? "other"} · ${row.is_checked ? "Purchased" : "Open"}`,
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
    ...(gymSessions.data ?? []).map((row) => ({
      id: `gym-session-${row.id}`,
      user_id: row.user_id,
      module: "gym",
      title: row.title,
      detail: `${row.focus.replaceAll("_", " ")} · ${row.calories_burned ?? 0} kcal`,
      value: `${row.duration_minutes ?? 0} min`,
      timestamp: row.logged_at,
    })),
    ...(gymPlans.data ?? []).map((row) => ({
      id: `gym-plan-${row.id}`,
      user_id: row.user_id,
      module: "gym-plan",
      title: row.title,
      detail: row.summary || `${row.level} · ${row.focus.replaceAll("_", " ")}`,
      value: `${row.days_per_week} days/wk`,
      timestamp: row.created_at,
    })),
    ...(history.data ?? []).map((row) => ({
      id: `history-${row.id}`,
      user_id: row.user_id,
      module: "health-history",
      title: row.weight_kg != null ? `${row.weight_kg} kg` : "Body measurement",
      detail: [
        row.height_cm != null ? `${row.height_cm} cm` : null,
        row.body_fat_pct != null ? `${row.body_fat_pct}% fat` : null,
        row.waist_cm != null ? `${row.waist_cm} cm waist` : null,
        row.note,
        row.source,
      ]
        .filter(Boolean)
        .join(" · "),
      value: row.recorded_at,
      timestamp: row.created_at ?? `${row.recorded_at}T00:00:00.000Z`,
    })),
    ...(goals.data ?? []).map((row) => ({
      id: `goal-${row.id}`,
      user_id: row.user_id,
      module: "goals",
      title: row.title,
      detail: `${row.category} · ${row.status}`,
      value:
        row.target_value == null
          ? "—"
          : `${row.current_value ?? 0}/${row.target_value}${row.unit ? ` ${row.unit}` : ""}`,
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
        Full read-only access to every member module — nutrition, movement, gym, health history,
        goals, spending, pantry, groceries, and AI — plus module reports and AI summaries.
      </p>
      <ActivityExplorer members={profiles.data ?? []} records={records} />
    </>
  );
}
