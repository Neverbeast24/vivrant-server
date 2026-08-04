import { describe, expect, it } from "vitest";
import { bmiBand, computeBmi, weightForBmi } from "./body-metrics";

describe("computeBmi", () => {
  it("computes BMI for valid inputs", () => {
    const bmi = computeBmi(170, 68);
    expect(bmi).not.toBeNull();
    expect(bmi!).toBeCloseTo(23.53, 1);
  });

  it("returns null for invalid inputs", () => {
    expect(computeBmi(0, 70)).toBeNull();
    expect(computeBmi(170, 0)).toBeNull();
    expect(computeBmi(-1, 70)).toBeNull();
  });
});

describe("bmiBand", () => {
  it("classifies bands", () => {
    expect(bmiBand(17)).toBe("underweight");
    expect(bmiBand(22)).toBe("normal");
    expect(bmiBand(27)).toBe("overweight");
    expect(bmiBand(32)).toBe("obese");
  });
});

describe("weightForBmi", () => {
  it("solves target weight from height and BMI", () => {
    const kg = weightForBmi(170, 22);
    expect(kg).toBeCloseTo(63.58, 1);
  });
});
