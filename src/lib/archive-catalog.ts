export const ARCHIVE_TABLES = [
  "nutrition_logs",
  "workout_logs",
  "expenses",
  "pantry_items",
  "grocery_items",
  "health_goals",
  "health_history",
  "gym_sessions",
  "gym_plans",
  "habits",
  "challenges",
  "journal_entries",
  "user_reminders",
] as const;

export type ArchiveTable = (typeof ARCHIVE_TABLES)[number];

export const ARCHIVE_LABELS: Record<ArchiveTable, string> = {
  nutrition_logs: "Meal",
  workout_logs: "Workout",
  expenses: "Expense",
  pantry_items: "Pantry item",
  grocery_items: "Grocery item",
  health_goals: "Goal",
  health_history: "Health history",
  gym_sessions: "Gym session",
  gym_plans: "Gym program",
  habits: "Habit",
  challenges: "Challenge",
  journal_entries: "Journal note",
  user_reminders: "Reminder",
};

const TITLE_KEYS: Record<ArchiveTable, string[]> = {
  nutrition_logs: ["meal_name"],
  workout_logs: ["title"],
  expenses: ["title"],
  pantry_items: ["name"],
  grocery_items: ["name"],
  health_goals: ["title"],
  health_history: ["note"],
  gym_sessions: ["title"],
  gym_plans: ["title"],
  habits: ["title"],
  challenges: ["title"],
  journal_entries: ["title"],
  user_reminders: ["title"],
};

export function isArchiveTable(value: string): value is ArchiveTable {
  return (ARCHIVE_TABLES as readonly string[]).includes(value);
}

export function titleFromRow(table: ArchiveTable, row: Record<string, unknown>): string {
  for (const key of TITLE_KEYS[table]) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 160);
  }
  if (typeof row.recorded_at === "string" && row.recorded_at) {
    return `Entry ${row.recorded_at.slice(0, 10)}`;
  }
  return ARCHIVE_LABELS[table];
}
