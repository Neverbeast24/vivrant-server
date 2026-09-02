import { describe, expect, it } from "vitest";
import {
  mealsForType,
  nextMealSuggestions,
  scaleMacros,
  suggestedMealType,
} from "./suggestions";

describe("suggestedMealType", () => {
  it("picks breakfast, lunch, dinner, then snack by hour", () => {
    expect(suggestedMealType(new Date(2026, 7, 18, 8))).toBe("breakfast");
    expect(suggestedMealType(new Date(2026, 7, 18, 12))).toBe("lunch");
    expect(suggestedMealType(new Date(2026, 7, 18, 19))).toBe("dinner");
    expect(suggestedMealType(new Date(2026, 7, 18, 22))).toBe("snack");
  });
});

describe("nextMealSuggestions", () => {
  it("suggests the current meal slot first", () => {
    const meals = nextMealSuggestions([], new Date(2026, 7, 18, 12));
    expect(meals.length).toBeGreaterThan(0);
    expect(meals.every((meal) => meal.meal_type === "lunch")).toBe(true);
  });

  it("switches to a snack when lunch is already logged", () => {
    const meals = nextMealSuggestions(["lunch"], new Date(2026, 7, 18, 12));
    expect(meals[0]?.meal_type).toBe("snack");
  });
});

describe("scaleMacros", () => {
  it("scales a typical plate up for a large portion", () => {
    const [meal] = mealsForType("breakfast", 1);
    const typical = scaleMacros(meal, "typical");
    const large = scaleMacros(meal, "large");
    expect(large.calories).toBeGreaterThan(typical.calories);
  });
});
