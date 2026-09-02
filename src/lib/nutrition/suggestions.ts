export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type PortionSize = "small" | "typical" | "large";

export type QuickMeal = {
  name: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  hint: string;
};

export const PORTION_SCALE: Record<PortionSize, number> = {
  small: 0.75,
  typical: 1,
  large: 1.35,
};

/** Ready-made estimates so users never need a scale or label. */
export const QUICK_MEALS: QuickMeal[] = [
  {
    name: "Eggs & toast",
    meal_type: "breakfast",
    calories: 350,
    protein_g: 18,
    carbs_g: 30,
    fat_g: 16,
    hint: "2 eggs + 1–2 toast",
  },
  {
    name: "Garlic rice & egg",
    meal_type: "breakfast",
    calories: 420,
    protein_g: 16,
    carbs_g: 52,
    fat_g: 14,
    hint: "1 plate + fried egg",
  },
  {
    name: "Oatmeal & fruit",
    meal_type: "breakfast",
    calories: 320,
    protein_g: 10,
    carbs_g: 55,
    fat_g: 6,
    hint: "1 bowl",
  },
  {
    name: "Chicken rice bowl",
    meal_type: "lunch",
    calories: 550,
    protein_g: 35,
    carbs_g: 55,
    fat_g: 15,
    hint: "palm protein + fist rice",
  },
  {
    name: "Chicken adobo & rice",
    meal_type: "lunch",
    calories: 580,
    protein_g: 38,
    carbs_g: 52,
    fat_g: 18,
    hint: "1 cup rice + 2 pieces",
  },
  {
    name: "Salad with protein",
    meal_type: "lunch",
    calories: 380,
    protein_g: 30,
    carbs_g: 18,
    fat_g: 18,
    hint: "big bowl + chicken/tofu",
  },
  {
    name: "Fish & veggies",
    meal_type: "dinner",
    calories: 420,
    protein_g: 32,
    carbs_g: 20,
    fat_g: 18,
    hint: "palm fish + veggies",
  },
  {
    name: "Sinigang & rice",
    meal_type: "dinner",
    calories: 480,
    protein_g: 28,
    carbs_g: 50,
    fat_g: 12,
    hint: "1 bowl + 1 cup rice",
  },
  {
    name: "Protein snack",
    meal_type: "snack",
    calories: 200,
    protein_g: 15,
    carbs_g: 12,
    fat_g: 8,
    hint: "yogurt, shake, or nuts",
  },
  {
    name: "Banana & peanut butter",
    meal_type: "snack",
    calories: 240,
    protein_g: 8,
    carbs_g: 28,
    fat_g: 12,
    hint: "1 banana + 1 tbsp",
  },
];

export function scaleMacros(meal: QuickMeal, portion: PortionSize) {
  const scale = PORTION_SCALE[portion];
  return {
    calories: Math.round(meal.calories * scale),
    protein_g: Math.round(meal.protein_g * scale * 10) / 10,
    carbs_g: Math.round(meal.carbs_g * scale * 10) / 10,
    fat_g: Math.round(meal.fat_g * scale * 10) / 10,
  };
}

/** Breakfast < 10, lunch 10–15, dinner 15–21, snack otherwise. */
export function suggestedMealType(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

export function mealsForType(type: MealType, limit = 3): QuickMeal[] {
  const matched = QUICK_MEALS.filter((meal) => meal.meal_type === type);
  if (matched.length >= limit) return matched.slice(0, limit);
  return [...matched, ...QUICK_MEALS.filter((meal) => meal.meal_type !== type)].slice(0, limit);
}

export function nextMealSuggestions(
  loggedTypes: Iterable<string>,
  date = new Date(),
  limit = 3,
): QuickMeal[] {
  const done = new Set(
    [...loggedTypes].map((type) => String(type).trim().toLowerCase()).filter(Boolean),
  );
  const preferred = suggestedMealType(date);
  const type = done.has(preferred) ? (preferred === "snack" ? "dinner" : "snack") : preferred;
  return mealsForType(type, limit);
}
