import { describe, expect, test } from "vitest";
import { MacrosInput, compute } from "./macros.js";
import { DomainError } from "../errors.js";

describe("macros tool", () => {
  test("default maintain fills carbs to budget", () => {
    const r = compute(MacrosInput.parse({
      calories: 2500, weight: { value: 80, unit: "kg" }, goal: "maintain",
    })).results.find((x) => x.method === "g-per-kg")!;
    expect((r.detail as any).protein_g).toBeCloseTo(160.0);
    expect((r.detail as any).carb_g).toBeCloseTo(303.0);
    expect(r.unit).toBe("kcal");
    expect(r.value).toBeCloseTo(2500.0);
  });
  test("cut higher / bulk lower protein", () => {
    expect(
      (compute(MacrosInput.parse({ calories: 2000, weight: { value: 80, unit: "kg" }, goal: "cut" }))
        .results[0].detail as any).protein_g,
    ).toBeCloseTo(176.0);
    const bulk = compute(MacrosInput.parse({ calories: 3000, weight: { value: 80, unit: "kg" }, goal: "bulk" })).results[0];
    expect((bulk.detail as any).protein_g).toBeCloseTo(144.0);
    expect(bulk.value).toBeCloseTo(3000.0);
  });
  test("overrides respected; unknown method raises", () => {
    const r = compute(MacrosInput.parse({
      calories: 2500, weight: { value: 80, unit: "kg" }, goal: "maintain",
      protein_g_per_kg: 1.6, fat_g_per_kg: 1.0,
    })).results[0];
    expect((r.detail as any).protein_g).toBeCloseTo(128.0);
    expect((r.detail as any).fat_g).toBeCloseTo(80.0);
    expect(() =>
      compute(MacrosInput.parse({ calories: 2500, weight: { value: 80, unit: "kg" }, methods: ["bogus"] })),
    ).toThrow(DomainError);
  });
});
