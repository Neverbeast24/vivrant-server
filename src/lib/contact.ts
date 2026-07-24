/** Public contact plan helpers — no personal contact details in the UI. */
export type ContactPlan = "plus" | "campus" | "general";

export const CONTACT_PLAN_LABEL: Record<ContactPlan, string> = {
  general: "General inquiry",
  plus: "Plus access",
  campus: "Campus / teams",
};
