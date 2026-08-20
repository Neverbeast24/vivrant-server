export const GROCERY_CATEGORY_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  produce: { label: "Fruits & vegetables", emoji: "🥬", color: "from-accent to-accent-deep" },
  protein: { label: "Meat & protein", emoji: "🍗", color: "from-accent to-accent-deep" },
  dairy: { label: "Dairy & eggs", emoji: "🥛", color: "from-cyan to-accent-deep" },
  grains: { label: "Grains & bread", emoji: "🍞", color: "from-[#6b8f7a] to-accent-deep" },
  pantry: { label: "Pantry staples", emoji: "🫙", color: "from-[#5c7a6b] to-accent-deep" },
  snacks: { label: "Snacks", emoji: "🍿", color: "from-cyan to-[#2a7a6e]" },
  drinks: { label: "Drinks", emoji: "🧃", color: "from-[#4ec4b6] to-accent" },
  household: { label: "Household", emoji: "🧼", color: "from-[#6b8a9a] to-[#3d5c70]" },
  other: { label: "Other", emoji: "🛒", color: "from-ink/40 to-ink/60" },
};

export const GROCERY_CATEGORY_ORDER = Object.keys(GROCERY_CATEGORY_META);
