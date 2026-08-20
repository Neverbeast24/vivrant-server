export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import { isMobileAuthError, requireMobileSuperAdmin } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";

const LIMIT = 200;

type ActivityRecord = {
  id: string;
  user_id: string;
  module: string;
  title: string;
  detail: string;
  value: string;
  timestamp: string;
};

/** Super-admin member activity across modules. */
export async function GET(request: Request) {
  const auth = await requireMobileSuperAdmin(request);
  if (isMobileAuthError(auth)) return auth;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server admin client is not configured.", 500);
  }

  const url = new URL(request.url);
  const memberId = url.searchParams.get("member_id") ?? "all";
  const moduleFilter = url.searchParams.get("module") ?? "all";

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
    journals,
    habits,
    reminders,
    tickets,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("user_id, display_name, email, role, status")
      .order("display_name")
      .limit(500),
    admin
      .from("daily_checkins")
      .select("id, user_id, energy, mood, steps, water_ml, sleep_minutes, note, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("nutrition_logs")
      .select("id, user_id, meal_name, meal_type, calories, protein_g, logged_at")
      .is("deleted_at", null)
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("workout_logs")
      .select("id, user_id, title, activity_type, duration_minutes, calories_burned, logged_at")
      .is("deleted_at", null)
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("expenses")
      .select("id, user_id, title, category, amount, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("grocery_items")
      .select("id, user_id, name, quantity, category, is_checked, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("pantry_items")
      .select("id, user_id, name, category, stock_level, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("ai_recommendations")
      .select("id, user_id, title, body, score, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("gym_sessions")
      .select("id, user_id, title, focus, duration_minutes, calories_burned, logged_at")
      .is("deleted_at", null)
      .order("logged_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("gym_plans")
      .select("id, user_id, title, focus, level, days_per_week, summary, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("health_history")
      .select("id, user_id, recorded_at, weight_kg, note, source, created_at")
      .is("deleted_at", null)
      .order("recorded_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("health_goals")
      .select("id, user_id, title, category, target_value, current_value, unit, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("journal_entries")
      .select("id, user_id, title, body, mood, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("habits")
      .select("id, user_id, title, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("user_reminders")
      .select("id, user_id, title, kind, enabled, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    admin
      .from("support_tickets")
      .select("id, user_id, subject, status, priority, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  const records: ActivityRecord[] = [
    ...(checkins.data ?? []).map((row) => ({
      id: `checkin-${row.id}`,
      user_id: row.user_id,
      module: "check-in",
      title: `Energy ${row.energy ?? "—"} · Mood ${row.mood ?? "—"}`,
      detail: row.note || `${row.steps ?? 0} steps · ${row.water_ml ?? 0} ml`,
      value: `${row.sleep_minutes ?? 0} min sleep`,
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
      detail: `${String(row.focus).replaceAll("_", " ")} · ${row.calories_burned ?? 0} kcal`,
      value: `${row.duration_minutes ?? 0} min`,
      timestamp: row.logged_at,
    })),
    ...(gymPlans.data ?? []).map((row) => ({
      id: `gym-plan-${row.id}`,
      user_id: row.user_id,
      module: "gym-plan",
      title: row.title,
      detail: row.summary || `${row.level} · ${String(row.focus).replaceAll("_", " ")}`,
      value: `${row.days_per_week} days/wk`,
      timestamp: row.created_at,
    })),
    ...(history.data ?? []).map((row) => ({
      id: `history-${row.id}`,
      user_id: row.user_id,
      module: "health-history",
      title: row.weight_kg != null ? `${row.weight_kg} kg` : "Body measurement",
      detail: [row.note, row.source].filter(Boolean).join(" · "),
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
    ...(journals.data ?? []).map((row) => ({
      id: `journal-${row.id}`,
      user_id: row.user_id,
      module: "journal",
      title: row.title || "Journal entry",
      detail: String(row.body ?? "").slice(0, 120),
      value: row.mood != null ? `Mood ${row.mood}` : "—",
      timestamp: row.created_at,
    })),
    ...(habits.data ?? []).map((row) => ({
      id: `habit-${row.id}`,
      user_id: row.user_id,
      module: "habits",
      title: row.title,
      detail: "Habit",
      value: "—",
      timestamp: row.created_at,
    })),
    ...(reminders.data ?? []).map((row) => ({
      id: `reminder-${row.id}`,
      user_id: row.user_id,
      module: "reminders",
      title: row.title,
      detail: `${row.kind} · ${row.enabled ? "On" : "Off"}`,
      value: "—",
      timestamp: row.created_at,
    })),
    ...(tickets.data ?? []).map((row) => ({
      id: `ticket-${row.id}`,
      user_id: row.user_id,
      module: "support",
      title: row.subject,
      detail: `${row.status} · ${row.priority}`,
      value: `#${row.id}`,
      timestamp: row.created_at,
    })),
  ]
    .filter((row) => memberId === "all" || row.user_id === memberId)
    .filter((row) => moduleFilter === "all" || row.module === moduleFilter)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 400);

  const modules = [
    "all",
    "check-in",
    "nutrition",
    "movement",
    "gym",
    "gym-plan",
    "health-history",
    "goals",
    "spending",
    "groceries",
    "pantry",
    "AI",
    "journal",
    "habits",
    "reminders",
    "support",
  ];

  return jsonOk({
    members: profiles.data ?? [],
    modules,
    records,
  });
}
