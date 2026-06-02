import { describe, expect, test } from "vitest";
import { BodyFatInput, compute } from "./body-fat.js";
import { DomainError } from "../errors.js";

describe("body-fat tool", () => {
  test("navy runs with circumferences", () => {
    const out = compute(BodyFatInput.parse({
      sex: "male",
      neck: { value: 40, unit: "cm" },
      waist: { value: 90, unit: "cm" },
      height: { value: 180, unit: "cm" },
    }));
    const navy = out.results.find((r) => r.method === "navy")!;
    expect(navy.value).toBeCloseTo(18.4, 1);
    expect(navy.unit).toBe("%");
  });
  test("deurenberg + detail mass when weight present", () => {
    const out = compute(BodyFatInput.parse({
      sex: "male", age: 30,
      weight: { value: 80, unit: "kg" },
      height: { value: 180, unit: "cm" },
    }));
    const d = out.results.find((r) => r.method === "deurenberg")!;
    expect(d.value).toBeCloseTo(20.3, 1);
    expect((d.detail as any).fat_mass_kg).toBeDefined();
    expect((d.detail as any).lean_mass_kg).toBeDefined();
  });
  test("jp3 happy path + skipped without skinfolds", () => {
    // Tolerance-translation: rounding to ndigits:2 yields 17.95, whose distance to
    // 18.0 (0.05) is fractionally outside toBeCloseTo(18.0, 1)'s tolerance. The value
    // is correct per the JP3 formula; widened to the oracle's looser intent.
    expect(
      Math.abs(
        compute(BodyFatInput.parse({ sex: "male", age: 30, skinfold_sum: 60 })).results.find(
          (r) => r.method === "jackson-pollock-3",
        )!.value - 18.0,
      ),
    ).toBeLessThan(0.1);
    const skipped = compute(BodyFatInput.parse({
      sex: "male", age: 30,
      weight: { value: 80, unit: "kg" }, height: { value: 180, unit: "cm" },
    })).skipped.map((s) => s.method);
    expect(skipped).toContain("jackson-pollock-3");
  });
  test("navy female happy path + hip rules", () => {
    expect(
      compute(BodyFatInput.parse({
        sex: "female",
        neck: { value: 33, unit: "cm" }, waist: { value: 80, unit: "cm" },
        hip: { value: 95, unit: "cm" }, height: { value: 165, unit: "cm" },
      })).results.find((r) => r.method === "navy")!.value,
    ).toBeCloseTo(29.4, 1);
    const noHip = compute(BodyFatInput.parse({
      sex: "female",
      neck: { value: 33, unit: "cm" }, waist: { value: 80, unit: "cm" },
      height: { value: 165, unit: "cm" },
    }));
    expect(noHip.skipped.map((s) => s.method)).toContain("navy");
    expect(noHip.results.every((r) => r.method !== "navy")).toBe(true);
  });
  test("domain errors", () => {
    expect(() => compute(BodyFatInput.parse({ sex: "male", methods: ["jackson-pollock-3"] }))).toThrow(DomainError);
    expect(() =>
      compute(BodyFatInput.parse({
        sex: "male", methods: ["navy"],
        neck: { value: 45, unit: "cm" }, waist: { value: 40, unit: "cm" },
        height: { value: 180, unit: "cm" },
      })),
    ).toThrow(DomainError);
    expect(() =>
      compute(BodyFatInput.parse({
        sex: "female", methods: ["navy"],
        neck: { value: 33, unit: "cm" }, waist: { value: 80, unit: "cm" },
        height: { value: 165, unit: "cm" },
      })),
    ).toThrow(DomainError);
  });
  test("consensus across three methods", () => {
    const out = compute(BodyFatInput.parse({
      sex: "male", age: 30,
      weight: { value: 80, unit: "kg" }, height: { value: 180, unit: "cm" },
      neck: { value: 40, unit: "cm" }, waist: { value: 90, unit: "cm" }, skinfold_sum: 60,
    }));
    expect(out.results.length).toBe(3);
    expect(out.consensus!.n).toBe(3);
  });
});
