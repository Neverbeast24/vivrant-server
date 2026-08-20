import { describe, expect, it } from "vitest";
import {
  asNumber,
  mapTypedLine,
  parseSpreadsheetPaste,
} from "@/lib/lists/parse-quick-list";

describe("parseSpreadsheetPaste", () => {
  it("parses one name per line", () => {
    expect(parseSpreadsheetPaste("eggs\nmilk\n\nrice")).toEqual([
      ["eggs"],
      ["milk"],
      ["rice"],
    ]);
  });

  it("parses tab-separated Excel paste and skips a header", () => {
    const text = "Name\tQty\tPrice\neggs\t1 tray\t180\nmilk\t1 L\t90";
    expect(parseSpreadsheetPaste(text)).toEqual([
      ["eggs", "1 tray", "180"],
      ["milk", "1 L", "90"],
    ]);
  });

  it("parses comma lists when most lines have commas", () => {
    expect(parseSpreadsheetPaste("eggs, 1 tray, 180\nmilk, 1L")).toEqual([
      ["eggs", "1 tray", "180"],
      ["milk", "1L"],
    ]);
  });

  it("keeps commas inside quoted cells", () => {
    expect(parseSpreadsheetPaste('"Eggs, dozen", protein\nmilk, dairy')).toEqual([
      ["Eggs, dozen", "protein"],
      ["milk", "dairy"],
    ]);
  });

  it("caps rows", () => {
    const text = Array.from({ length: 60 }, (_, i) => `item ${i + 1}`).join("\n");
    expect(parseSpreadsheetPaste(text, 40)).toHaveLength(40);
  });
});

describe("mapTypedLine", () => {
  it("maps name, quantity, category, and price", () => {
    expect(
      mapTypedLine(["Purefoods hotdog", "1 pack", "protein", "159"], ["protein", "produce"]),
    ).toEqual({
      name: "Purefoods hotdog",
      quantity: "1 pack",
      category: "protein",
      amount: 159,
    });
  });

  it("treats a lone number as amount", () => {
    expect(mapTypedLine(["milk", "90"], ["dairy"])).toEqual({
      name: "milk",
      quantity: undefined,
      category: undefined,
      amount: 90,
    });
  });
});

describe("asNumber", () => {
  it("strips peso formatting", () => {
    expect(asNumber("₱1,200")).toBe(1200);
  });
});
