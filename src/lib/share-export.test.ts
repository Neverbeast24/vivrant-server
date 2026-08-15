import { describe, expect, it } from "vitest";
import {
  csvEscape,
  filenameSlug,
  gymPlanDoc,
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
        { name: "Lat pulldown machine", sets: "4 sets of 10-12 reps", rest: "90s", weight: "15–20 kg" },
        { name: "Treadmill steady incline walk", sets: "1 set of 35-40 mins", rest: "0s", weight: "easy pace" },
      ],
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
    expect(doc.text).toContain("Lat pulldown machine");
    expect(doc.text).toContain("15–20 kg");
    expect(doc.text).toContain("Start at the light end");
    expect(doc.csv).toContain("Weight");
    expect(doc.text).toContain("Day 1");
    expect(doc.csv).toContain("Lat pulldown machine");
    expect(doc.csv.split("\n")).toHaveLength(3);
    expect(doc.text).toContain("Coach notes");
    expect(doc.text).toContain("Start light");
    expect(JSON.parse(doc.json).days_per_week).toBe(6);
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
