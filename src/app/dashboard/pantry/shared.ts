export type PantryItem = {
  id: number;
  name: string;
  category: string;
  stock_level: number;
  created_at?: string;
};

export const PANTRY_CATEGORIES = [
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "protein", label: "Protein" },
  { value: "dairy", label: "Dairy" },
  { value: "grains", label: "Grains" },
  { value: "snacks", label: "Snacks" },
  { value: "drinks", label: "Drinks" },
  { value: "condiments", label: "Condiments" },
  { value: "frozen", label: "Frozen" },
  { value: "other", label: "Other" },
] as const;

export const LOW_STOCK_THRESHOLD = 25;

export function categoryLabel(value: string) {
  return PANTRY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** Map pantry shelves onto grocery-list categories. */
export function pantryToGroceryCategory(category: string) {
  const c = String(category ?? "").toLowerCase();
  if (c === "vegetables" || c === "fruits") return "produce";
  if (c === "protein" || c === "dairy" || c === "grains" || c === "snacks" || c === "drinks") return c;
  if (c === "condiments" || c === "frozen") return "pantry";
  return "other";
}
