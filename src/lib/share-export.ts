import { formatGymExerciseLine, humanizeGymLabel, type GymPlan, type GymSession } from "@/lib/gym";

export type ShareExportDoc = {
  title: string;
  filename: string;
  text: string;
  csv: string;
  json: string;
};

export function csvEscape(value: unknown) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function filenameSlug(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return slug || "vivrant-export";
}

function jsonPretty(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function heading(title: string, lines: string[]) {
  return [`VIVRΛNT`, title, "", ...lines].join("\n").trimEnd() + "\n";
}

export function gymPlanDoc(plan: GymPlan): ShareExportDoc {
  const focus = humanizeGymLabel(plan.focus);
  const recs = plan.recommendations ?? [];
  const lines = [
    plan.title,
    `${focus} · ${plan.level} · ${plan.days_per_week} days/week`,
    plan.summary ? `\n${plan.summary}` : "",
    recs.length ? `\nCoach notes\n${recs.map((rec) => `• ${rec}`).join("\n")}` : "",
    "",
    ...(plan.days ?? []).flatMap((day) => [
      `${day.day} — ${humanizeGymLabel(day.focus)}`,
      ...(day.exercises ?? []).map((ex) => {
        const notes = ex.notes ? ` · ${ex.notes}` : "";
        return `• ${formatGymExerciseLine(ex)}${notes}`;
      }),
      ...(day.alternatives ?? []).map(
        (swap) => `  Alternative: ${swap.use} instead of ${swap.instead_of}`,
      ),
      ...(day.additionals ?? []).map(
        (addon) => `  Add-on: ${addon.name}${addon.sets ? ` · ${addon.sets}` : ""}`,
      ),
      "",
    ]),
  ];
  const csv = toCsv([
    ["Day", "Focus", "Exercise", "Sets", "Weight", "Rest", "Notes"],
    ...(plan.days ?? []).flatMap((day) =>
      (day.exercises ?? []).map((ex) => [
        day.day,
        humanizeGymLabel(day.focus),
        ex.name,
        ex.sets,
        ex.weight ?? "",
        ex.rest,
        ex.notes ?? "",
      ]),
    ),
  ]);
  return {
    title: plan.title,
    filename: filenameSlug(plan.title),
    text: heading(plan.title, lines),
    csv,
    json: jsonPretty({
      title: plan.title,
      focus: plan.focus,
      level: plan.level,
      days_per_week: plan.days_per_week,
      summary: plan.summary,
      recommendations: recs,
      days: plan.days,
    }),
  };
}

export function gymPlansDoc(plans: GymPlan[]): ShareExportDoc {
  if (plans.length === 1) return gymPlanDoc(plans[0]);
  const text = plans.map((plan) => gymPlanDoc(plan).text.trimEnd()).join("\n\n---\n\n") + "\n";
  const csv = toCsv([
    ["Program", "Day", "Focus", "Exercise", "Sets", "Weight", "Rest", "Notes"],
    ...plans.flatMap((plan) =>
      (plan.days ?? []).flatMap((day) =>
        (day.exercises ?? []).map((ex) => [
          plan.title,
          day.day,
          humanizeGymLabel(day.focus),
          ex.name,
          ex.sets,
          ex.weight ?? "",
          ex.rest,
          ex.notes ?? "",
        ]),
      ),
    ),
  ]);
  return {
    title: "Saved training programs",
    filename: "vivrant-training-programs",
    text: heading("Saved training programs", [text]),
    csv,
    json: jsonPretty(plans.map((plan) => JSON.parse(gymPlanDoc(plan).json))),
  };
}

export function gymSessionsDoc(
  sessions: Pick<
    GymSession,
    "title" | "focus" | "duration_minutes" | "calories_burned" | "exercises" | "notes" | "logged_at"
  >[],
): ShareExportDoc {
  const lines = sessions.flatMap((session) => {
    const moves = (session.exercises ?? [])
      .map((ex) => `  • ${ex.name ?? "Movement"}${ex.sets ? ` · ${ex.sets}` : ""}`)
      .join("\n");
    return [
      `${session.title} · ${humanizeGymLabel(session.focus)} · ${session.duration_minutes ?? 0} min · ${session.calories_burned ?? 0} kcal`,
      session.logged_at ? `Logged ${session.logged_at.slice(0, 10)}` : "",
      moves,
      session.notes ? `Notes: ${session.notes}` : "",
      "",
    ];
  });
  return {
    title: "Gym workouts",
    filename: "vivrant-gym-workouts",
    text: heading("Gym workouts", lines),
    csv: toCsv([
      ["Title", "Focus", "Minutes", "Calories", "Exercises", "Notes", "Logged"],
      ...sessions.map((session) => [
        session.title,
        humanizeGymLabel(session.focus),
        session.duration_minutes ?? "",
        session.calories_burned ?? "",
        (session.exercises ?? []).map((ex) => `${ex.name ?? ""}${ex.sets ? ` (${ex.sets})` : ""}`).join("; "),
        session.notes ?? "",
        session.logged_at?.slice(0, 10) ?? "",
      ]),
    ]),
    json: jsonPretty(sessions),
  };
}

export type GroceryExportItem = {
  name: string;
  quantity?: string | null;
  category?: string | null;
  is_checked?: boolean;
  estimated_price?: number | null;
};

export function groceryListDoc(items: GroceryExportItem[]): ShareExportDoc {
  const lines = items.map((item) => {
    const qty = item.quantity ? ` (${item.quantity})` : "";
    const price =
      item.estimated_price != null ? ` · ₱${Number(item.estimated_price).toLocaleString()}` : "";
    const done = item.is_checked ? "[x]" : "[ ]";
    return `${done} ${item.name}${qty}${price}`;
  });
  return {
    title: "Shopping list",
    filename: "vivrant-shopping-list",
    text: heading("Shopping list", lines),
    csv: toCsv([
      ["Name", "Quantity", "Category", "Checked", "Estimated price"],
      ...items.map((item) => [
        item.name,
        item.quantity ?? "",
        item.category ?? "",
        item.is_checked ? "yes" : "no",
        item.estimated_price ?? "",
      ]),
    ]),
    json: jsonPretty(items),
  };
}

export function groceryPlanDoc(plan: {
  title: string;
  summary?: string;
  meals?: string[];
  items: { name: string; category?: string; quantity?: string; estimated_price?: number }[];
  estimated_total?: number;
  budget_note?: string;
}): ShareExportDoc {
  const lines = [
    plan.summary ?? "",
    plan.budget_note ? `Budget: ${plan.budget_note}` : "",
    plan.estimated_total != null ? `Estimated total: ₱${Number(plan.estimated_total).toLocaleString()}` : "",
    "",
    ...(plan.meals?.length ? ["Meals", ...plan.meals.map((meal) => `• ${meal}`), ""] : []),
    "Items",
    ...plan.items.map((item) => {
      const qty = item.quantity ? ` (${item.quantity})` : "";
      const price =
        item.estimated_price != null ? ` · ₱${Number(item.estimated_price).toLocaleString()}` : "";
      return `• ${item.name}${qty}${price}`;
    }),
  ];
  return {
    title: plan.title,
    filename: filenameSlug(plan.title),
    text: heading(plan.title, lines),
    csv: toCsv([
      ["Name", "Quantity", "Category", "Estimated price"],
      ...plan.items.map((item) => [
        item.name,
        item.quantity ?? "",
        item.category ?? "",
        item.estimated_price ?? "",
      ]),
    ]),
    json: jsonPretty(plan),
  };
}

export function mealsDoc(
  meals: {
    meal_name: string;
    meal_type: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    logged_at: string;
  }[],
): ShareExportDoc {
  const lines = meals.map(
    (meal) =>
      `${meal.logged_at.slice(0, 10)} · ${meal.meal_type} · ${meal.meal_name} · ~${meal.calories ?? 0} kcal (P${meal.protein_g ?? 0} C${meal.carbs_g ?? 0} F${meal.fat_g ?? 0})`,
  );
  return {
    title: "Meal log",
    filename: "vivrant-meals",
    text: heading("Meal log", lines),
    csv: toCsv([
      ["Date", "Type", "Meal", "Calories", "Protein g", "Carbs g", "Fat g"],
      ...meals.map((meal) => [
        meal.logged_at.slice(0, 10),
        meal.meal_type,
        meal.meal_name,
        meal.calories ?? "",
        meal.protein_g ?? "",
        meal.carbs_g ?? "",
        meal.fat_g ?? "",
      ]),
    ]),
    json: jsonPretty(meals),
  };
}

export function expensesDoc(
  expenses: { title: string; category: string; amount: number; spent_at: string }[],
): ShareExportDoc {
  const total = expenses.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const lines = [
    ...expenses.map(
      (row) =>
        `${row.spent_at.slice(0, 10)} · ${row.title} · ${humanizeGymLabel(row.category)} · ₱${Number(row.amount).toLocaleString()}`,
    ),
    "",
    `Total: ₱${total.toLocaleString()}`,
  ];
  return {
    title: "Health spending",
    filename: "vivrant-expenses",
    text: heading("Health spending", lines),
    csv: toCsv([
      ["Date", "Title", "Category", "Amount"],
      ...expenses.map((row) => [
        row.spent_at.slice(0, 10),
        row.title,
        row.category,
        row.amount,
      ]),
    ]),
    json: jsonPretty(expenses),
  };
}

export function journalNoteDoc(entry: {
  title: string;
  body: string;
  entry_date: string;
  mood?: number | null;
  tags?: string[] | null;
}): ShareExportDoc {
  const title = entry.title.trim() || "Journal note";
  const lines = [
    entry.entry_date,
    entry.mood != null ? `Mood: ${entry.mood}/5` : "",
    entry.tags?.length ? `Tags: ${entry.tags.join(", ")}` : "",
    "",
    entry.body,
  ];
  return {
    title,
    filename: filenameSlug(title),
    text: heading(title, lines),
    csv: toCsv([
      ["Date", "Title", "Mood", "Tags", "Body"],
      [entry.entry_date, title, entry.mood ?? "", (entry.tags ?? []).join("; "), entry.body],
    ]),
    json: jsonPretty(entry),
  };
}

export function journalEntriesDoc(
  entries: {
    title: string;
    body: string;
    entry_date: string;
    mood?: number | null;
    tags?: string[] | null;
  }[],
): ShareExportDoc {
  if (entries.length === 1) return journalNoteDoc(entries[0]);
  const text = entries.map((entry) => journalNoteDoc(entry).text.trimEnd()).join("\n\n---\n\n") + "\n";
  return {
    title: "Journal notes",
    filename: "vivrant-journal",
    text: heading("Journal notes", [text]),
    csv: toCsv([
      ["Date", "Title", "Mood", "Tags", "Body"],
      ...entries.map((entry) => [
        entry.entry_date,
        entry.title,
        entry.mood ?? "",
        (entry.tags ?? []).join("; "),
        entry.body,
      ]),
    ]),
    json: jsonPretty(entries),
  };
}

export function reportsDoc(input: {
  checkins: number;
  meals: number;
  workouts: number;
  gymSessions: number;
  gymMinutes: number;
  expensesTotal: number;
  activeGoals: number;
  historyEntries: number;
  avgEnergy: number | null;
  totalWorkoutMinutes: number;
  totalCalories: number;
  categoryTotals: { category: string; total: number }[];
  story?: { title: string; story: string; focuses: string[]; score: number } | null;
  summary: string;
}): ShareExportDoc {
  const lines = [
    input.summary,
    "",
    `Check-ins: ${input.checkins}`,
    `Average energy: ${input.avgEnergy ?? "—"}`,
    `Meals: ${input.meals} · ${input.totalCalories.toLocaleString()} kcal`,
    `Workouts: ${input.workouts} · ${input.totalWorkoutMinutes} min`,
    `Gym: ${input.gymSessions} sessions · ${input.gymMinutes} min`,
    `Health spend: ₱${input.expensesTotal.toLocaleString()}`,
    `Active goals: ${input.activeGoals}`,
    `Body history entries: ${input.historyEntries}`,
    "",
    ...input.categoryTotals.map(
      (row) => `${humanizeGymLabel(row.category)}: ₱${row.total.toLocaleString()}`,
    ),
    ...(input.story
      ? ["", input.story.title, input.story.story, `Focus: ${input.story.focuses.join(", ")}`]
      : []),
  ];
  return {
    title: "Weekly summary",
    filename: "vivrant-weekly-summary",
    text: heading("Weekly summary", lines),
    csv: toCsv([
      ["Metric", "Value"],
      ["Check-ins", input.checkins],
      ["Average energy", input.avgEnergy ?? ""],
      ["Meals", input.meals],
      ["Calories", input.totalCalories],
      ["Workouts", input.workouts],
      ["Workout minutes", input.totalWorkoutMinutes],
      ["Gym sessions", input.gymSessions],
      ["Gym minutes", input.gymMinutes],
      ["Health spend", input.expensesTotal],
      ["Active goals", input.activeGoals],
      ...input.categoryTotals.map((row) => [`Spend · ${row.category}`, row.total]),
    ]),
    json: jsonPretty(input),
  };
}

export function movementWorkoutsDoc(
  workouts: {
    title: string;
    activity_type: string;
    duration_minutes: number | null;
    calories_burned: number | null;
  }[],
): ShareExportDoc {
  const lines = workouts.map(
    (row) =>
      `${row.title} · ${humanizeGymLabel(row.activity_type)} · ${row.duration_minutes ?? 0} min · ${row.calories_burned ?? 0} kcal`,
  );
  return {
    title: "Activity log",
    filename: "vivrant-activity",
    text: heading("Activity log", lines),
    csv: toCsv([
      ["Title", "Type", "Minutes", "Calories"],
      ...workouts.map((row) => [
        row.title,
        row.activity_type,
        row.duration_minutes ?? "",
        row.calories_burned ?? "",
      ]),
    ]),
    json: jsonPretty(workouts),
  };
}

export function pantryDoc(
  items: { name: string; category: string; stock_level: number }[],
): ShareExportDoc {
  const lines = items.map(
    (item) => `${item.name} · ${humanizeGymLabel(item.category)} · stock ${item.stock_level}%`,
  );
  return {
    title: "Pantry inventory",
    filename: "vivrant-pantry",
    text: heading("Pantry inventory", lines),
    csv: toCsv([
      ["Name", "Category", "Stock %"],
      ...items.map((item) => [item.name, item.category, item.stock_level]),
    ]),
    json: jsonPretty(items),
  };
}

export function goalsDoc(
  goals: {
    title: string;
    category: string;
    target_value: number | null;
    current_value: number;
    unit: string | null;
    target_date: string | null;
    status: string;
  }[],
): ShareExportDoc {
  const lines = goals.map((goal) => {
    const unit = goal.unit ? ` ${goal.unit}` : "";
    const target = goal.target_value != null ? ` → ${goal.target_value}${unit}` : "";
    return `${goal.title} · ${goal.status} · ${goal.current_value}${unit}${target}${goal.target_date ? ` by ${goal.target_date}` : ""}`;
  });
  return {
    title: "Health goals",
    filename: "vivrant-goals",
    text: heading("Health goals", lines),
    csv: toCsv([
      ["Title", "Category", "Current", "Target", "Unit", "Date", "Status"],
      ...goals.map((goal) => [
        goal.title,
        goal.category,
        goal.current_value,
        goal.target_value ?? "",
        goal.unit ?? "",
        goal.target_date ?? "",
        goal.status,
      ]),
    ]),
    json: jsonPretty(goals),
  };
}

export function healthHistoryDoc(
  entries: {
    recorded_at: string;
    weight_kg: number | null;
    height_cm: number | null;
    body_fat_pct: number | null;
    waist_cm: number | null;
    note: string | null;
  }[],
): ShareExportDoc {
  const lines = entries.map((entry) => {
    const parts = [
      entry.recorded_at.slice(0, 10),
      entry.weight_kg != null ? `${entry.weight_kg} kg` : null,
      entry.body_fat_pct != null ? `${entry.body_fat_pct}% bf` : null,
      entry.waist_cm != null ? `waist ${entry.waist_cm} cm` : null,
      entry.note,
    ].filter(Boolean);
    return parts.join(" · ");
  });
  return {
    title: "Health history",
    filename: "vivrant-health-history",
    text: heading("Health history", lines),
    csv: toCsv([
      ["Date", "Weight kg", "Height cm", "Body fat %", "Waist cm", "Note"],
      ...entries.map((entry) => [
        entry.recorded_at.slice(0, 10),
        entry.weight_kg ?? "",
        entry.height_cm ?? "",
        entry.body_fat_pct ?? "",
        entry.waist_cm ?? "",
        entry.note ?? "",
      ]),
    ]),
    json: jsonPretty(entries),
  };
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export async function nativeShare(doc: ShareExportDoc, kind: "text" | "csv" | "json" = "text") {
  const body = kind === "csv" ? doc.csv : kind === "json" ? doc.json : doc.text;
  const ext = kind === "csv" ? "csv" : kind === "json" ? "json" : "txt";
  const mime =
    kind === "csv" ? "text/csv" : kind === "json" ? "application/json" : "text/plain";
  const file = new File([body], `${doc.filename}.${ext}`, { type: mime });
  const canFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  if (canFiles) {
    await navigator.share({ title: doc.title, text: doc.text, files: [file] });
    return;
  }
  if (typeof navigator.share === "function") {
    await navigator.share({ title: doc.title, text: body });
    return;
  }
  await copyText(body);
}

export function printDocument(title: string, text: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    throw new Error("Print window unavailable");
  }
  const safeTitle = title.replace(/[<>&]/g, "");
  doc.open();
  doc.write(`<!doctype html><html><head><title>${safeTitle}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 16px; }
  pre { white-space: pre-wrap; font: 14px/1.55 ui-sans-serif, system-ui, sans-serif; margin: 0; }
</style></head><body><h1>${safeTitle}</h1><pre></pre></body></html>`);
  doc.close();
  const pre = doc.querySelector("pre");
  if (pre) pre.textContent = text;
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", cleanup);
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(cleanup, 1500);
}

export function canNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
