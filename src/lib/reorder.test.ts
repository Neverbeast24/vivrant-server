import { describe, expect, it } from "vitest";
import { applyIdOrder, moveItem, parseListOrder } from "./reorder";

describe("moveItem", () => {
  it("moves an item forward and backward", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("ignores no-op and out-of-range indexes", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, 0)).toBe(list);
    expect(moveItem(list, -1, 1)).toBe(list);
    expect(moveItem(list, 0, 9)).toBe(list);
  });
});

describe("applyIdOrder", () => {
  it("puts known ids first and appends the rest", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(applyIdOrder(items, [3, 1])).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
  });
});

describe("parseListOrder", () => {
  it("keeps only known modules and positive ids", () => {
    expect(
      parseListOrder({ groceries: [2, "3", 0, -1], meals: [9], habits: [4] }),
    ).toEqual({ groceries: [2, 3], habits: [4] });
  });
});
