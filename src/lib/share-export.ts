import {
  formatGymExerciseLine,
  formatGymMoveName,
  formatTrainingDaysLabel,
  humanizeGymLabel,
  type GymPlan,
  type GymPlanDay,
  type GymSession,
} from "@/lib/gym";
import {
  hydrateDraftPlan,
  remainingTrainingDays,
  type GymProgramDraft,
} from "@/lib/gym-program-draft";

export type ShareExportDoc = {
  title: string;
  filename: string;
  text: string;
  csv: string;
  json: string;
  /** Formatted markup used only by Print / Save PDF. */
  html?: string;
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function printLabel(value: string) {
  return humanizeGymLabel(value).replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function printChip(kind: "sets" | "weight" | "rest", label: string) {
  const text = String(label ?? "").trim();
  if (!text) return "";
  return `<span class="chip ${kind}">${escapeHtml(text)}</span>`;
}

function gymCoachNotesHtml(recs: string[]) {
  if (!recs.length) return "";
  return `<section class="coach">
    <p class="callout-label">Coach notes</p>
    <ul>${recs.map((rec) => `<li>${escapeHtml(rec)}</li>`).join("")}</ul>
  </section>`;
}

function gymDayPrintHtml(day: GymPlanDay) {
  const exercises = day.exercises ?? [];
  const alts = day.alternatives ?? [];
  const addons = day.additionals ?? [];
  const moves = exercises
    .map((ex, index) => {
      const notes = ex.notes
        ? `<p class="move-notes">${escapeHtml(ex.notes)}</p>`
        : "";
      return `<li>
        <span class="n">${index + 1}</span>
        <div>
          <p class="move-name">${escapeHtml(formatGymMoveName(ex.name) || ex.name)}</p>
          <p class="move-meta">
            ${printChip("sets", ex.sets)}
            ${ex.weight ? printChip("weight", ex.weight) : ""}
            ${printChip("rest", `rest ${ex.rest}`)}
          </p>
          ${notes}
        </div>
      </li>`;
    })
    .join("");
  const altBlock = alts.length
    ? `<div class="callout alts">
        <p class="callout-label">Alternatives</p>
        <ul>${alts
          .map(
            (swap) =>
              `<li><strong>${escapeHtml(formatGymMoveName(swap.use) || swap.use)}</strong> <em>instead of</em> ${escapeHtml(formatGymMoveName(swap.instead_of) || swap.instead_of)}</li>`,
          )
          .join("")}</ul>
      </div>`
    : "";
  const addonBlock = addons.length
    ? `<div class="callout addons">
        <p class="callout-label">Add to this workout</p>
        <ul>${addons
          .map(
            (addon) =>
              `<li><strong>${escapeHtml(formatGymMoveName(addon.name) || addon.name)}</strong>${addon.sets ? ` <em>· ${escapeHtml(addon.sets)}</em>` : ""}</li>`,
          )
          .join("")}</ul>
      </div>`
    : "";
  return `<section class="day">
    <div class="day-head">
      <h3>${escapeHtml(day.day)}</h3>
      <p class="focus">${escapeHtml(printLabel(day.focus))}</p>
    </div>
    <ol class="moves">${moves}</ol>
    ${altBlock}
    ${addonBlock}
  </section>`;
}

function gymPlanArticleHtml(plan: GymPlan, headingTag: "h1" | "h2" = "h1") {
  const recs = plan.recommendations ?? [];
  const days = (plan.days ?? []).map(gymDayPrintHtml).join("");
  return `<header class="sheet-head">
      ${headingTag === "h1" ? `<p class="brand">VIVRΛNT</p><p class="kind">Training program</p>` : `<p class="kind">Program</p>`}
      <${headingTag}>${escapeHtml(plan.title)}</${headingTag}>
      <p class="meta"><em>${escapeHtml(printLabel(plan.focus))}</em> · <strong>${escapeHtml(plan.level)}</strong> · ${escapeHtml(formatTrainingDaysLabel(plan.training_days ?? []) || `${plan.days_per_week} days/week`)}</p>
      ${plan.summary ? `<p class="summary">${escapeHtml(plan.summary)}</p>` : ""}
    </header>
    ${gymCoachNotesHtml(recs)}
    ${days}`;
}

function gymPlanPrintHtml(plan: GymPlan) {
  return `<article class="program">${gymPlanArticleHtml(plan)}</article>`;
}

function gymPlansPrintHtml(plans: GymPlan[]) {
  const articles = plans
    .map(
      (plan, index) =>
        `<article class="program${index < plans.length - 1 ? " page-break" : ""}">${gymPlanArticleHtml(plan, "h2")}</article>`,
    )
    .join("");
  return `<header class="sheet-head">
      <p class="brand">VIVRΛNT</p>
      <p class="kind">Export</p>
      <h1>Saved training programs</h1>
      <p class="meta"><em>${plans.length} program${plans.length === 1 ? "" : "s"}</em></p>
    </header>
    ${articles}`;
}

function brandedPlainPrintHtml(title: string, text: string) {
  const withoutBrand = text.replace(/^\s*VIVRΛNT\s*\r?\n/, "");
  const withoutTitle = withoutBrand.replace(
    new RegExp(`^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\r?\\n+`),
    "",
  );
  return `<header class="sheet-head">
      <p class="brand">VIVRΛNT</p>
      <h1>${escapeHtml(title)}</h1>
    </header>
    <pre class="plain">${escapeHtml(withoutTitle.trim())}</pre>`;
}

export function gymPlanDoc(plan: GymPlan): ShareExportDoc {
  const focus = humanizeGymLabel(plan.focus);
  const recs = plan.recommendations ?? [];
  const lines = [
    plan.title,
    `${focus} · ${plan.level} · ${formatTrainingDaysLabel(plan.training_days ?? []) || `${plan.days_per_week} days/week`}`,
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
        formatGymMoveName(ex.name) || ex.name,
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
      training_days: plan.training_days ?? [],
      summary: plan.summary,
      recommendations: recs,
      days: plan.days,
    }),
    html: gymPlanPrintHtml(plan),
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
          formatGymMoveName(ex.name) || ex.name,
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
    html: gymPlansPrintHtml(plans),
  };
}

export function gymProgramDraftDoc(draft: GymProgramDraft): ShareExportDoc {
  const keptPlan = hydrateDraftPlan(draft);
  const remaining = remainingTrainingDays(draft.training_days, draft.kept_days);
  const remainingLabel = remaining
    .map((iso) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][iso - 1])
    .filter(Boolean)
    .join(", ");
  const keptDoc = gymPlanDoc({
    ...keptPlan,
    title: `${draft.title} — days you kept`,
  });
  const previewLines = (draft.preview_days ?? []).flatMap((day) => [
    `${day.day} — ${humanizeGymLabel(day.focus)}`,
    ...(day.exercises ?? []).map((ex) => `• ${formatGymExerciseLine(ex)}`),
    "",
  ]);
  return {
    title: `${draft.title} (in progress)`,
    filename: filenameSlug(`${draft.title}-draft`),
    text: heading(`${draft.title} (in progress)`, [
      remaining.length ? `Still to pick: ${remainingLabel}` : "All training days kept.",
      "",
      keptDoc.text.replace(/^VIVRΛNT\n[\s\S]*?\n\n/, "").trimEnd(),
      "",
      "Latest generated options",
      "",
      ...previewLines,
    ]),
    csv: keptDoc.csv,
    json: jsonPretty({
      title: draft.title,
      focus: draft.focus,
      level: draft.level,
      training_days: draft.training_days,
      kept_days: draft.kept_days,
      preview_days: draft.preview_days,
      remaining_days: remaining,
      summary: draft.summary,
      recommendations: draft.recommendations,
    }),
    html: keptDoc.html,
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
      .map((ex) => {
        const bits = [
          ex.name ?? "Movement",
          ex.sets ? ` · ${ex.sets}` : "",
          ex.weight ? ` · ${ex.weight}` : "",
          ex.rest ? ` · rest ${ex.rest}` : "",
          ex.completed_sets != null ? ` · ${ex.completed_sets} sets done` : "",
        ];
        return `  • ${bits.join("")}`;
      })
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
        (session.exercises ?? [])
          .map((ex) => {
            const done = ex.completed_sets != null ? ` ${ex.completed_sets} done` : "";
            return `${ex.name ?? ""}${ex.sets ? ` (${ex.sets}${done})` : done}`;
          })
          .join("; "),
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

const PRINT_DOCUMENT_STYLES = `
  @page { margin: 12mm 11mm; size: A4; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    padding: 8px 4px 16px;
    color: #14221b;
    background: #fff;
    font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
    font-size: 12.5px;
    line-height: 1.5;
  }
  .brand {
    margin: 0;
    color: #0e7c66;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.2em;
  }
  .kind {
    margin: 6px 0 0;
    color: #0e7c66;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  h1, h2, h3 { margin: 0; letter-spacing: -0.02em; }
  h1 { margin-top: 8px; font-size: 22px; font-weight: 900; }
  h2 { margin-top: 6px; font-size: 18px; font-weight: 900; }
  h3 { font-size: 14px; font-weight: 900; }
  .meta { margin: 6px 0 0; color: #4a5c54; }
  .meta em { color: #0e7c66; font-style: italic; font-weight: 700; }
  .meta strong { color: #0a5c4c; }
  .summary { margin: 10px 0 0; color: #4a5c54; font-style: italic; line-height: 1.55; }
  .coach {
    margin-top: 16px;
    padding: 12px 14px;
    background: #d7efe6;
    border-left: 4px solid #0e7c66;
    border-radius: 10px;
  }
  .coach ul, .callout ul { margin: 8px 0 0; padding: 0 0 0 1.1rem; }
  .coach li { margin: 0 0 4px; }
  .day {
    margin-top: 16px;
    overflow: hidden;
    border: 1px solid #dce8e1;
    border-radius: 12px;
    break-inside: avoid;
  }
  .day-head { padding: 10px 14px; background: #0e7c66; color: #fff; }
  .day-head .focus { margin: 2px 0 0; font-size: 12px; font-style: italic; opacity: 0.92; }
  .moves { margin: 0; padding: 4px 0; list-style: none; }
  .moves li {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid #e7eee9;
  }
  .n {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    margin-top: 1px;
    border-radius: 999px;
    background: #d7efe6;
    color: #0a5c4c;
    font-size: 11px;
    font-weight: 800;
  }
  .move-name { margin: 0; font-size: 13.5px; font-weight: 800; }
  .move-meta { margin: 6px 0 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .chip.sets { background: #d7efe6; color: #0a5c4c; }
  .chip.weight { background: #0e7c66; color: #fff; font-weight: 800; }
  .chip.rest { background: #e8efe9; color: #4a5c54; font-style: italic; font-weight: 600; }
  .move-notes { margin: 6px 0 0; color: #4a5c54; font-size: 11.5px; font-style: italic; }
  .callout { padding: 10px 14px 12px; border-top: 1px dashed #b7d4c8; background: #f6faf7; }
  .callout-label {
    margin: 0;
    color: #0e7c66;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .callout li { margin: 0 0 4px; color: #4a5c54; }
  .callout strong { color: #14221b; }
  .callout em { color: #0e7c66; }
  .program { margin-top: 8px; }
  .program.page-break { page-break-after: always; break-after: page; padding-bottom: 8px; }
  .plain {
    margin: 16px 0 0;
    white-space: pre-wrap;
    font: 13px/1.55 ui-sans-serif, system-ui, sans-serif;
    color: #14221b;
  }
  .sheet-foot {
    margin: 22px 0 0;
    padding-top: 10px;
    border-top: 1px solid #dce8e1;
    color: #4a5c54;
    font-size: 10px;
    font-style: italic;
  }
`;

export function printDocument(title: string, text: string, html?: string) {
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
  const safeTitle = escapeHtml(title);
  const printedOn = new Date().toLocaleDateString(undefined, { dateStyle: "medium" });
  const body = html?.trim() || brandedPlainPrintHtml(title, text);
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>${PRINT_DOCUMENT_STYLES}</style></head><body>
${body}
<p class="sheet-foot">Generated by VIVRΛNT · ${escapeHtml(printedOn)}</p>
</body></html>`);
  doc.close();
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", cleanup);
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(cleanup, 1500);
}

export function canNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
