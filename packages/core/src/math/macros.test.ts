import { describe, expect, test } from "vitest";
import { macrosGPerKg } from "./macros.js";

describe("macros", () => {
  test("reference split fills carbs to budget", () => {
    const m = macrosGPerKg(2500, 80, 2.0, 0.9);
    expect(m.protein_g).toBeCloseTo(160.0);
    expect(m.fat_g).toBeCloseTo(72.0);
    expect(m.carb_g).toBeCloseTo(303.0);
  });
  test("carbs clamp to zero; calories recomputed", () => {
    const m = macrosGPerKg(1000, 80, 2.0, 0.9);
    expect(m.carb_g).toBe(0);
    expect(m.protein_g).toBeCloseTo(160.0);
    expect(m.fat_g).toBeCloseTo(72.0);
    expect(m.calories).toBeCloseTo(1288.0); // 160*4 + 72*9
  });
});
