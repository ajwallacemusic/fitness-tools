import { describe, expect, test } from "vitest";
import { TdeeInput, compute } from "./tdee.js";
import { DomainError } from "../errors.js";

const base = (extra: Record<string, unknown> = {}) =>
  TdeeInput.parse({
    sex: "male", age: 30,
    height: { value: 180, unit: "cm" },
    weight: { value: 80, unit: "kg" },
    activity: "moderate",
    ...extra,
  });

describe("tdee tool", () => {
  test("mifflin + harris run by default", () => {
    const methods = new Set(compute(base()).results.map((r) => r.method));
    expect(methods.has("mifflin")).toBe(true);
    expect(methods.has("harris")).toBe(true);
  });
  test("mifflin tdee reference + detail", () => {
    const out = compute(base());
    const mifflin = out.results.find((r) => r.method === "mifflin")!;
    expect(mifflin.value).toBeCloseTo(2759.0, 1);
    expect(mifflin.unit).toBe("kcal/day");
    expect((mifflin.detail as any).bmr).toBeCloseTo(1780.0);
  });
  test("harris tdee reference", () => {
    const harris = compute(base()).results.find((r) => r.method === "harris")!;
    expect(harris.value).toBeCloseTo(2873.13, 1);
  });
  test("katch/cunningham skipped without body fat", () => {
    const skipped = new Set(compute(base()).skipped.map((s) => s.method));
    expect(skipped.has("katch")).toBe(true);
    expect(skipped.has("cunningham")).toBe(true);
  });
  test("katch runs with body fat / lean mass", () => {
    expect(compute(base({ body_fat: 15 })).results.find((r) => r.method === "katch")!.value)
      .toBeCloseTo(2850.14, 1);
    expect(
      compute(base({ lean_mass: { value: 68, unit: "kg" } })).results.find(
        (r) => r.method === "katch",
      )!.value,
    ).toBeCloseTo(2850.14, 1);
  });
  test("consensus present; explicit missing raises", () => {
    expect(compute(base()).consensus!.n).toBeGreaterThanOrEqual(2);
    expect(() => compute(base({ methods: ["katch"] }))).toThrow(DomainError);
  });
});
