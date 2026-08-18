import { describe, expect, it } from "vitest";
import { pantryToGroceryCategory } from "@/app/dashboard/pantry/shared";

describe("pantryToGroceryCategory", () => {
  it("maps produce shelves onto grocery produce", () => {
    expect(pantryToGroceryCategory("vegetables")).toBe("produce");
    expect(pantryToGroceryCategory("fruits")).toBe("produce");
  });

  it("keeps matching grocery categories", () => {
    expect(pantryToGroceryCategory("protein")).toBe("protein");
    expect(pantryToGroceryCategory("dairy")).toBe("dairy");
  });

  it("maps condiments and frozen onto pantry", () => {
    expect(pantryToGroceryCategory("condiments")).toBe("pantry");
    expect(pantryToGroceryCategory("frozen")).toBe("pantry");
  });
});
