import { describe, expect, it } from "vitest";
import {
  csvEscape,
  filenameSlug,
  gymPlanDoc,
  gymPlansDoc,
  gymProgramDraftDoc,
  groceryListDoc,
  mealsDoc,
  toCsv,
} from "./share-export";

const samplePlan = {
  id: 1,
  title: "6-Day Low-Impact Fat Loss & Conditioning Plan",
  focus: "fat_loss",
  level: "Beginner",
  days_per_week: 6,
  summary: "Built for an overweight BMI band.",
  recommendations: ["Start at the light end of each weight range."],
  created_at: "2026-08-15",
  days: [
    {
      day: "Day 1",
      focus: "upper_body_pull_and_cardio",
      exercises: [
        { name: "Lat pulldown machine", sets: "4 sets of 10-12 reps", rest: "90s", weight: "15–20 kg", notes: "Keep the chest tall." },
        { name: "Treadmill steady incline walk", sets: "1 set of 35-40 mins", rest: "0s", weight: "easy pace" },
      ],
      alternatives: [{ instead_of: "Lat pulldown machine", use: "Assisted pull-up machine" }],
      additionals: [{ name: "Face pulls", sets: "3 x 15" }],
    },
  ],
};

describe("csvEscape", () => {
  it("quotes commas and quotes", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("plain")).toBe("plain");
  });
});

describe("filenameSlug", () => {
  it("slugifies titles", () => {
    expect(filenameSlug("6-Day Low-Impact Plan")).toBe("6-day-low-impact-plan");
    expect(filenameSlug("!!!")).toBe("vivrant-export");
  });
});

describe("gymPlanDoc", () => {
  it("includes title, days, and csv rows", () => {
    const doc = gymPlanDoc(samplePlan);
    expect(doc.title).toContain("Fat Loss");
    expect(doc.text).toContain("Lat Pulldown Machine");
    expect(doc.text).toContain("15–20 kg");
    expect(doc.text).toContain("Assisted pull-up machine");
    expect(doc.text).toContain("Face pulls");
    expect(doc.text).toContain("Start at the light end");
    expect(doc.csv).toContain("Weight");
    expect(doc.text).toContain("Day 1");
    expect(doc.csv).toContain("Lat Pulldown Machine");
    expect(doc.csv.split("\n")).toHaveLength(3);
    expect(JSON.parse(doc.json).days_per_week).toBe(6);
    expect(JSON.parse(doc.json).training_days).toEqual([]);
  });

  it("builds print-only html with emphasis and color-coded chips", () => {
    const doc = gymPlanDoc(samplePlan);
    expect(doc.html).toContain('class="move-name">Lat Pulldown Machine');
    expect(doc.html).toContain('class="chip sets">4 sets of 10-12 reps');
    expect(doc.html).toContain('class="chip weight">15–20 kg');
    expect(doc.html).toContain('class="chip rest">rest 90s');
    expect(doc.html).toContain("<em>Fat Loss</em>");
    expect(doc.html).toContain("<strong>Beginner</strong>");
    expect(doc.html).toContain("<strong>Assisted Pull-Up Machine</strong>");
    expect(doc.html).toContain("<em>instead of</em>");
    expect(doc.html).toContain("<strong>Face Pulls</strong>");
    expect(doc.html).toContain('class="summary">Built for an overweight BMI band.');
    expect(doc.html).toContain('class="move-notes">Keep the chest tall.');
    expect(doc.text).not.toContain("class=");
  });
});

describe("gymPlansDoc", () => {
  it("wraps multiple programs for print without changing csv shape", () => {
    const second = { ...samplePlan, id: 2, title: "Push strength block" };
    const doc = gymPlansDoc([samplePlan, second]);
    expect(doc.title).toBe("Saved training programs");
    expect(doc.html).toContain("Saved training programs");
    expect(doc.html).toContain("Push strength block");
    expect(doc.html).toContain("page-break");
    expect(doc.csv.startsWith("Program,Day,Focus")).toBe(true);
  });
});

describe("gymProgramDraftDoc", () => {
  it("exports kept days and remaining slots", () => {
    const doc = gymProgramDraftDoc({
      title: "Builder week",
      focus: "strength",
      level: "beginner",
      summary: null,
      recommendations: [],
      prefs: {
        days_per_week: 3,
        training_days: [1, 3, 5],
        session_minutes: 45,
        level: "beginner",
        known_machine_slugs: [],
        known_custom_exercises: [],
        avoid_targets: [],
      },
      preview_days: samplePlan.days,
      kept_days: { "1": samplePlan.days[0] },
      training_days: [1, 3, 5],
      updated_at: "2026-08-19T00:00:00.000Z",
    });
    expect(doc.text).toContain("Still to pick");
    expect(doc.text).toContain("Latest generated options");
    expect(JSON.parse(doc.json).remaining_days).toEqual([3, 5]);
  });
});

describe("groceryListDoc", () => {
  it("marks checked items and prices", () => {
    const doc = groceryListDoc([
      { name: "Eggs", quantity: "1 tray", category: "protein", is_checked: true, estimated_price: 180 },
    ]);
    expect(doc.text).toContain("[x] Eggs (1 tray)");
    expect(doc.csv).toContain("yes");
  });
});

describe("mealsDoc", () => {
  it("builds a csv header and meal row", () => {
    const doc = mealsDoc([
      {
        meal_name: "Chicken rice",
        meal_type: "lunch",
        calories: 520,
        protein_g: 38,
        carbs_g: 55,
        fat_g: 12,
        logged_at: "2026-08-15T08:00:00.000Z",
      },
    ]);
    expect(toCsv([["a", "b"]])).toBe("a,b");
    expect(doc.csv.startsWith("Date,Type,Meal")).toBe(true);
    expect(doc.text).toContain("Chicken rice");
  });
});
